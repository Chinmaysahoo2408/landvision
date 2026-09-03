import os
import json
import joblib
from datetime import datetime
from typing import Dict, Any, List, Optional

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

class ModelRegistry:
    def __init__(self, base_dir: str = MODELS_DIR):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)
        self.active_versions = {
            "Award_Delay": "v1.0",
            "Payment_Delay": "v1.0",
            "Possession_Delay": "v1.0",
            "Overall_Delay": "v1.0",
            "Risk_Level": "v1.0"
        }
        self.loaded_models: Dict[str, Any] = {}
        self.loaded_preprocessors: Dict[str, Any] = {}

    def save_model(
        self,
        target_name: str,
        version: str,
        model_obj: Any,
        preprocessor_obj: Any,
        metrics: Dict[str, Any],
        algorithm: str,
        training_rows: int,
        feature_names: List[str],
        comparison_results: Dict[str, Any] = None
    ) -> str:
        target_dir = os.path.join(self.base_dir, target_name, version)
        os.makedirs(target_dir, exist_ok=True)
        
        model_path = os.path.join(target_dir, "model.joblib")
        prep_path = os.path.join(target_dir, "preprocessor.joblib")
        meta_path = os.path.join(target_dir, "metadata.json")
        
        joblib.dump(model_obj, model_path)
        joblib.dump(preprocessor_obj, prep_path)
        
        metadata = {
            "target": target_name,
            "version": version,
            "algorithm": algorithm,
            "training_rows": training_rows,
            "metrics": metrics,
            "feature_names": feature_names,
            "created_at": datetime.now().isoformat(),
            "comparison": comparison_results or {}
        }
        
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)
            
        self.active_versions[target_name] = version
        cache_key = f"{target_name}_{version}"
        self.loaded_models[cache_key] = model_obj
        self.loaded_preprocessors[cache_key] = preprocessor_obj
        
        return target_dir

    def get_model(self, target_name: str, version: Optional[str] = None):
        ver = version or self.active_versions.get(target_name, "v1.0")
        cache_key = f"{target_name}_{ver}"
        
        if cache_key in self.loaded_models and cache_key in self.loaded_preprocessors:
            return self.loaded_models[cache_key], self.loaded_preprocessors[cache_key], self.get_metadata(target_name, ver)
            
        target_dir = os.path.join(self.base_dir, target_name, ver)
        model_path = os.path.join(target_dir, "model.joblib")
        prep_path = os.path.join(target_dir, "preprocessor.joblib")
        
        if not os.path.exists(model_path) or not os.path.exists(prep_path):
            return None, None, None
            
        model = joblib.load(model_path)
        prep = joblib.load(prep_path)
        meta = self.get_metadata(target_name, ver)
        
        self.loaded_models[cache_key] = model
        self.loaded_preprocessors[cache_key] = prep
        return model, prep, meta

    def get_metadata(self, target_name: str, version: str) -> Optional[Dict[str, Any]]:
        meta_path = os.path.join(self.base_dir, target_name, version, "metadata.json")
        if not os.path.exists(meta_path):
            return None
        with open(meta_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def list_models(self) -> List[Dict[str, Any]]:
        out = []
        if not os.path.exists(self.base_dir):
            return out
        for target in os.listdir(self.base_dir):
            target_path = os.path.join(self.base_dir, target)
            if not os.path.isdir(target_path):
                continue
            for ver in os.listdir(target_path):
                ver_path = os.path.join(target_path, ver)
                meta_path = os.path.join(ver_path, "metadata.json")
                if os.path.exists(meta_path):
                    with open(meta_path, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                        meta["is_active"] = (self.active_versions.get(target) == ver)
                        out.append(meta)
        return out

    def activate_version(self, target_name: str, version: str) -> bool:
        target_dir = os.path.join(self.base_dir, target_name, version)
        if os.path.exists(target_dir):
            self.active_versions[target_name] = version
            return True
        return False

registry = ModelRegistry()
