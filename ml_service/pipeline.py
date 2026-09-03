import os
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
import joblib

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score, accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

try:
    from xgboost import XGBRegressor, XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

NUMERICAL_FEATURES = [
    "Land_Required_Hectare",
    "Land_Remaining_Hectare",
    "Affected_Families",
    "Compensation_Amount",
    "Project_Cost"
]

CATEGORICAL_FEATURES = [
    "State",
    "District",
    "Project_Type",
    "Legal_Dispute",
    "Court_Case",
    "Environmental_Clearance",
    "Forest_Clearance",
    "Rehabilitation_Issue"
]

class PreprocessingPipeline:
    def __init__(self):
        self.num_imputer = SimpleImputer(strategy="median")
        self.scaler = StandardScaler()
        self.cat_imputer = SimpleImputer(strategy="most_frequent")
        self.encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
        self.feature_names = []
        self.is_fitted = False

    def fit(self, df: pd.DataFrame) -> "PreprocessingPipeline":
        df_copy = df.copy()
        
        # Identify available numerical & categorical cols
        available_num = [c for c in NUMERICAL_FEATURES if c in df_copy.columns]
        available_cat = [c for c in CATEGORICAL_FEATURES if c in df_copy.columns]
        
        # Fit numerical
        if available_num:
            num_data = self.num_imputer.fit_transform(df_copy[available_num])
            self.scaler.fit(num_data)
        
        # Fit categorical
        if available_cat:
            cat_data = self.cat_imputer.fit_transform(df_copy[available_cat].astype(str))
            self.encoder.fit(cat_data)
            
        self.available_num = available_num
        self.available_cat = available_cat
        self.is_fitted = True
        return self

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("Pipeline is not fitted yet.")
        df_copy = df.copy()
        
        arrays = []
        if self.available_num:
            # fill missing columns with 0
            for c in self.available_num:
                if c not in df_copy.columns:
                    df_copy[c] = 0.0
            num_data = self.num_imputer.transform(df_copy[self.available_num])
            num_scaled = self.scaler.transform(num_data)
            arrays.append(num_scaled)
            
        if self.available_cat:
            for c in self.available_cat:
                if c not in df_copy.columns:
                    df_copy[c] = "Unknown"
            cat_data = self.cat_imputer.transform(df_copy[self.available_cat].astype(str))
            cat_encoded = self.encoder.transform(cat_data)
            arrays.append(cat_encoded)
            
        if not arrays:
            raise ValueError("No matching features found to transform.")
            
        return np.hstack(arrays)

    def get_feature_names(self) -> List[str]:
        names = list(self.available_num)
        if self.available_cat:
            cat_names = self.encoder.get_feature_names_out(self.available_cat)
            names.extend(list(cat_names))
        return names

def train_and_compare_regression(X_train, y_train, X_test, y_test) -> Dict[str, Any]:
    models = {
        "Linear Regression (Baseline)": LinearRegression(),
        "Random Forest Regressor": RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42),
        "Gradient Boosting Regressor": GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42),
    }
    if HAS_XGBOOST:
        models["XGBoost Regressor"] = XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.08, random_state=42)
        
    results = {}
    best_name = None
    best_r2 = -float("inf")
    
    for name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        mae = float(mean_absolute_error(y_test, preds))
        rmse = float(root_mean_squared_error(y_test, preds))
        r2 = float(r2_score(y_test, preds))
        
        results[name] = {
            "model": model,
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "r2": round(max(0.0, r2), 3),
        }
        
        if r2 > best_r2:
            best_r2 = r2
            best_name = name
            
    return {
        "best_model_name": best_name,
        "best_model": results[best_name]["model"],
        "comparison": {k: {"mae": v["mae"], "rmse": v["rmse"], "r2": v["r2"]} for k, v in results.items()},
        "best_metrics": {
            "mae": results[best_name]["mae"],
            "rmse": results[best_name]["rmse"],
            "r2": results[best_name]["r2"]
        }
    }

def train_and_compare_classification(X_train, y_train, X_test, y_test) -> Dict[str, Any]:
    models = {
        "Logistic Regression (Baseline)": LogisticRegression(max_iter=1000, random_state=42),
        "Random Forest Classifier": RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42),
        "Gradient Boosting Classifier": GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42),
    }
    if HAS_XGBOOST:
        models["XGBoost Classifier"] = XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.08, random_state=42)
        
    results = {}
    best_name = None
    best_f1 = -float("inf")
    
    classes = list(np.unique(y_train))
    
    for name, model in models.items():
        try:
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            acc = float(accuracy_score(y_test, preds))
            prec = float(precision_score(y_test, preds, average="weighted", zero_division=0))
            rec = float(recall_score(y_test, preds, average="weighted", zero_division=0))
            f1 = float(f1_score(y_test, preds, average="weighted", zero_division=0))
            cm = confusion_matrix(y_test, preds).tolist()
            
            results[name] = {
                "model": model,
                "accuracy": round(acc * 100, 2),
                "precision": round(prec * 100, 2),
                "recall": round(rec * 100, 2),
                "f1Score": round(f1 * 100, 2),
                "confusion_matrix": cm,
                "classes": classes
            }
            
            if f1 > best_f1:
                best_f1 = f1
                best_name = name
        except Exception as e:
            continue
            
    if not best_name and results:
        best_name = list(results.keys())[0]
        
    return {
        "best_model_name": best_name,
        "best_model": results[best_name]["model"],
        "comparison": {k: {
            "accuracy": v["accuracy"],
            "precision": v["precision"],
            "recall": v["recall"],
            "f1Score": v["f1Score"]
        } for k, v in results.items()},
        "best_metrics": {
            "accuracy": results[best_name]["accuracy"],
            "precision": results[best_name]["precision"],
            "recall": results[best_name]["recall"],
            "f1Score": results[best_name]["f1Score"],
            "confusion_matrix": results[best_name]["confusion_matrix"]
        }
    }
