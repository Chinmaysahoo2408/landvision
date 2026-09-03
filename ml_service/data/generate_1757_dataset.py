import os
import pandas as pd
import numpy as np

# Header
cols = [
    "State", "District", "Project_Type", "Land_Required_Hectare",
    "Land_Remaining_Hectare", "Affected_Families", "Compensation_Amount",
    "Project_Cost", "Legal_Dispute", "Court_Case", "Environmental_Clearance",
    "Forest_Clearance", "Rehabilitation_Issue", "Overall_Delay"
]

# Raw provided snippet lines
raw_data_lines = """Karnataka,Chamarajanagar,Port Development,107.88,48.87,817,1717257924.0,1498.96,Yes,Yes,Pending,Under Review,No,1143
Andhra Pradesh,West Godavari,Mining Project,703.02,29.84,2188,5122457962.0,1962.18,No,No,Not Required,Obtained,No,457
Assam,Biswanath,State Highway,359.5,241.83,4745,10392940192.0,12493.69,No,No,Obtained,Not Required,No,417
Andhra Pradesh,Chittoor,Power Plant,406.76,316.77,1864,5647015286.0,5386.86,Yes,Yes,Not Required,Obtained,No,1710
Arunachal Pradesh,Kra Daadi,State Highway,240.88,6.03,2295,5914719546.0,7083.29,Yes,Yes,Pending,Not Required,Yes,1217
Gujarat,Anand,Industrial Corridor,151.9,104.43,942,1263973482.0,774.74,Yes,No,Under Review,Obtained,No,422
Gujarat,Patan,Port Development,123.37,79.75,1091,4062775381.0,2522.13,No,No,Obtained,Pending,No,566
Nagaland,Wokha,Industrial Corridor,33.38,26.03,499,649517138.0,497.87,No,No,Pending,Pending,No,252
Telangana,Yadadri Bhuvanagiri,State Highway,630.99,448.78,8940,14136857651.0,8315.02,No,No,Pending,Under Review,No,793
Madhya Pradesh,Dhar,Port Development,628.25,246.0,6960,20071233662.0,22255.57,No,No,Pending,Under Review,Yes,729
Manipur,Tengnoupal,Urban Infrastructure,713.56,211.52,7828,17006426403.0,12359.41,Yes,Yes,Not Required,Not Required,Yes,1133
Mizoram,Aizawl,Mining Project,506.38,136.22,5414,17179222307.0,16269.35,No,No,Pending,Under Review,No,356
Uttar Pradesh,Kushinagar (Padrauna),Airport,242.37,6.54,1025,4513928840.0,4919.24,Yes,Yes,Under Review,Under Review,Yes,1618
Rajasthan,Pali,Power Plant,590.2,351.18,1911,1044857820.0,730.81,Yes,No,Under Review,Under Review,No,1237
Telangana,Adilabad,Mining Project,516.91,378.32,7452,19194147560.0,23208.38,No,No,Pending,Not Required,No,375
Bihar,Bhojpur,Irrigation/Dam,308.18,158.04,1801,5829786814.0,1902.42,No,No,Obtained,Obtained,No,297
Gujarat,Banaskantha (Palanpur),Port Development,180.58,6.16,1483,3278780161.0,4874.25,No,No,Pending,Under Review,No,521
Assam,Majuli,Railway Line,190.57,112.12,2341,6501229199.0,8222.02,Yes,Yes,Obtained,Obtained,Yes,393
Punjab,Amritsar,Urban Infrastructure,593.19,368.01,7287,6900065200.0,4555.45,No,No,Pending,Obtained,No,343
Punjab,Muktsar,State Highway,297.12,234.66,3198,9986717627.0,7746.13,No,No,Pending,Obtained,Yes,544
Karnataka,Mysuru (Mysore),SEZ,306.02,44.78,925,2003173785.0,1978.42,Yes,Yes,Obtained,Under Review,No,268
Madhya Pradesh,Vidisha,National Highway,562.54,334.85,3804,10822399864.0,4167.15,No,No,Obtained,Pending,No,486
Madhya Pradesh,Rajgarh,Port Development,748.21,270.23,2810,12037033332.0,11400.82,No,No,Obtained,Not Required,No,683
Telangana,Nirmal,Irrigation/Dam,766.43,50.89,3494,5879505652.0,2207.24,No,No,Obtained,Pending,Yes,790
Himachal Pradesh,Chamba,State Highway,261.68,149.98,2385,2023662605.0,2677.12,No,No,Not Required,Not Required,Yes,798
Assam,South Salmara-Mankachar,Power Plant,15.87,7.52,78,299044501.0,130.43,No,No,Pending,Obtained,No,639
Bihar,East Champaran (Motihari),Port Development,665.23,395.43,8462,19663664613.0,24929.32,No,No,Obtained,Obtained,No,475
Manipur,Kakching,National Highway,673.39,356.01,4631,11781020132.0,5880.65,No,No,Obtained,Obtained,No,599
Uttarakhand,Rudraprayag,Mining Project,560.42,428.76,7572,7294223758.0,9913.34,No,No,Pending,Obtained,No,446
Bihar,Samastipur,SEZ,62.3,6.89,158,59836884.0,84.09,No,No,Pending,Pending,No,344
Arunachal Pradesh,West Siang,Port Development,174.46,102.55,2465,9859086790.0,13360.29,No,No,Obtained,Not Required,No,451
West Bengal,Dakshin Dinajpur (South Dinajpur),Irrigation/Dam,756.8,449.63,7674,21780616138.0,11922.51,No,No,Obtained,Obtained,No,469
Tamil Nadu,Kanchipuram,Airport,86.62,10.56,659,1348235450.0,1206.46,No,No,Pending,Under Review,Yes,963
Uttarakhand,Champawat,Railway Line,731.43,249.34,5179,9848065124.0,14165.76,Yes,Yes,Obtained,Obtained,No,1432
Uttar Pradesh,Jhansi,SEZ,779.46,511.55,2090,9231869398.0,9971.5,No,No,Under Review,Pending,No,169
Bihar,Vaishali,Port Development,142.18,85.56,1093,2345109677.0,2174.61,Yes,Yes,Obtained,Pending,Yes,1600
Rajasthan,Nagaur,SEZ,192.21,84.42,1004,2759185697.0,2970.77,Yes,Yes,Not Required,Under Review,Yes,1188
Andhra Pradesh,Visakhapatnam,Irrigation/Dam,350.64,153.24,5049,20087862283.0,12375.47,No,No,Obtained,Under Review,No,592
Rajasthan,Jhalawar,Railway Line,70.37,47.41,613,2680398445.0,3475.8,No,No,Not Required,Not Required,No,521
Telangana,Kamareddy,Mining Project,651.05,20.25,6555,19945863174.0,9990.05,Yes,No,Obtained,Obtained,No,1071
Andhra Pradesh,Anantapur,Irrigation/Dam,513.34,400.4,2862,3541682357.0,4192.52,No,No,Not Required,Obtained,No,148
Nagaland,Kohima,SEZ,108.28,29.76,1483,3970716154.0,5799.62,No,No,Pending,Obtained,No,295
Maharashtra,Ratnagiri,Urban Infrastructure,770.26,499.22,5941,23849965197.0,29297.59,Yes,Yes,Obtained,Under Review,No,738
Odisha,Bhadrak,Urban Infrastructure,147.63,107.58,1546,6222717400.0,4974.86,No,No,Not Required,Not Required,Yes,870
Uttar Pradesh,RaeBareli,Mining Project,50.71,40.33,404,627441382.0,268.92,Yes,No,Obtained,Obtained,No,695
Haryana,Sirsa,SEZ,645.33,221.96,5756,16155953928.0,8111.14,No,No,Obtained,Pending,No,355
Delhi (NCT),North Delhi,National Highway,92.14,43.01,552,2249301654.0,3028.73,No,No,Pending,Obtained,No,559
Madhya Pradesh,Singrauli,Mining Project,289.74,200.56,3964,9268898155.0,7646.84,Yes,Yes,Obtained,Obtained,Yes,1545
Mizoram,Kolasib,Airport,381.16,253.37,1018,4539803865.0,5768.61,No,No,Obtained,Obtained,No,273
Tamil Nadu,Nilgiris,Urban Infrastructure,489.68,55.48,1627,4331702078.0,3936.51,Yes,Yes,Obtained,Pending,No,1822
Haryana,Gurgaon,Irrigation/Dam,385.99,185.03,3314,13804954737.0,15600.3,No,No,Not Required,Pending,No,350
Puducherry (UT),Karaikal,Mining Project,486.04,22.01,6712,12192163087.0,5822.19,No,No,Obtained,Pending,Yes,721
Odisha,Deogarh,Airport,159.01,25.87,1734,7574129546.0,6584.16,Yes,Yes,Obtained,Pending,Yes,1318
Uttar Pradesh,Sambhal (Bhim Nagar),SEZ,721.29,484.53,3308,7651532807.0,8403.61,Yes,Yes,Pending,Not Required,No,1022
Maharashtra,Dhule,National Highway,599.4,72.18,8435,24987218399.0,26452.28,Yes,Yes,Obtained,Pending,Yes,1732
Odisha,Jajpur,SEZ,684.73,500.41,8997,21185202377.0,31667.58,No,No,Not Required,Obtained,No,356
Bihar,Begusarai,Mining Project,489.55,241.82,5326,12730218302.0,12727.53,Yes,Yes,Obtained,Not Required,No,1371
Uttarakhand,Nainital,State Highway,348.6,80.97,2848,8075730941.0,11523.95,No,No,Pending,Not Required,Yes,376
Odisha,Cuttack,National Highway,192.33,135.78,1710,1200201446.0,881.29,No,No,Pending,Obtained,No,530
Chhattisgarh,Jashpur,Urban Infrastructure,603.87,390.77,4010,14353933671.0,19219.31,Yes,Yes,Obtained,Not Required,No,971
Rajasthan,Karauli,Power Plant,140.25,48.56,306,767606612.0,942.64,No,No,Not Required,Pending,Yes,435
Assam,Sonitpur,Mining Project,609.19,388.15,5567,23360387890.0,19289.59,No,No,Obtained,Under Review,No,321
Karnataka,Ramanagara,Industrial Corridor,654.19,81.48,4131,14554128021.0,14844.36,No,No,Obtained,Pending,Yes,564
Odisha,Sambalpur,State Highway,565.83,238.14,3263,13916172946.0,20551.79,No,No,Obtained,Pending,No,664
Rajasthan,Jalore,Airport,591.54,258.73,1393,722709373.0,773.23,No,No,Not Required,Obtained,No,558
Chhattisgarh,Sukma,Port Development,661.06,513.84,1712,5125908928.0,5085.54,No,No,Not Required,Pending,No,541
Jharkhand,Godda,Industrial Corridor,25.46,16.89,147,94687345.0,124.28,Yes,Yes,Obtained,Not Required,Yes,1604
Uttar Pradesh,Bijnor,Irrigation/Dam,197.67,152.68,2484,7327803471.0,8146.4,No,No,Pending,Obtained,No,515
Rajasthan,Banswara,Irrigation/Dam,261.32,188.63,2181,6982752088.0,3820.19,No,No,Not Required,Not Required,Yes,747
Nagaland,Phek,Power Plant,430.57,2.89,2727,4286511091.0,1569.86,No,No,Pending,Pending,No,429
Lakshadweep (UT),Chethlath,Industrial Corridor,266.04,72.49,2930,2754372403.0,2699.93,No,No,Under Review,Obtained,Yes,699
Karnataka,Chikkamagaluru (Chikmagalur),Irrigation/Dam,421.67,191.05,4608,3971707115.0,5939.16,No,No,Not Required,Obtained,No,326
Odisha,Rayagada,Port Development,429.25,301.68,997,4197857978.0,5130.71,No,No,Under Review,Obtained,No,576
Assam,Barpeta,Mining Project,374.32,132.54,5213,4220997986.0,1941.69,No,No,Pending,Pending,Yes,960
Arunachal Pradesh,Dibang Valley,State Highway,309.12,237.72,2509,2855758568.0,4004.18,Yes,No,Not Required,Obtained,No,1042
Jharkhand,Dumka,Urban Infrastructure,353.39,164.07,1470,2997154316.0,4070.51,No,No,Obtained,Not Required,No,434
Jharkhand,Bokaro,Mining Project,768.64,385.19,10949,21476478411.0,9046.72,Yes,Yes,Obtained,Under Review,No,1166
West Bengal,Purba Medinipur (East Medinipur),Railway Line,7.28,0.04,16,42322764.0,61.33,No,No,Obtained,Obtained,No,380
Chhattisgarh,Narayanpur,SEZ,193.21,78.21,1292,3493006122.0,3007.08,No,No,Obtained,Not Required,Yes,961
Uttar Pradesh,Siddharth Nagar,Port Development,410.34,116.91,2443,3495526423.0,2225.49,No,No,Obtained,Obtained,Yes,46
Rajasthan,Jaisalmer,Mining Project,379.52,178.23,4909,16263621440.0,21990.26,No,No,Not Required,Not Required,No,595
Gujarat,Porbandar,Urban Infrastructure,663.31,487.87,9877,29922931502.0,10114.59,No,No,Obtained,Pending,No,443
Karnataka,Udupi,Airport,368.62,121.11,3153,13709842994.0,4184.31,No,No,Pending,Pending,No,659
Chhattisgarh,Bemetara,Urban Infrastructure,387.07,194.71,5475,18001165469.0,16544.71,Yes,Yes,Obtained,Pending,No,1030
Delhi (NCT),South East Delhi,Port Development,460.91,168.44,6289,12307801377.0,8789.76,No,No,Obtained,Obtained,No,354
Madhya Pradesh,Shivpuri,Industrial Corridor,775.22,259.81,8511,27161217822.0,13200.09,No,No,Obtained,Pending,No,217
Maharashtra,Washim,SEZ,539.31,167.79,5926,16586102094.0,20645.87,Yes,Yes,Pending,Under Review,Yes,1130
Himachal Pradesh,Kangra,State Highway,204.06,102.55,2805,2791550958.0,2165.15,Yes,Yes,Obtained,Not Required,No,300
Uttar Pradesh,Bhadohi,Irrigation/Dam,159.41,71.89,847,3502312120.0,4086.13,No,No,Obtained,Not Required,No,647
Haryana,Panchkula,Power Plant,160.13,78.92,1489,4530867669.0,3583.74,No,No,Pending,Pending,Yes,431
Maharashtra,Raigad,Port Development,701.25,119.54,6148,13505682255.0,17454.91,Yes,No,Pending,Pending,No,1505
Tamil Nadu,Coimbatore,State Highway,335.92,79.44,2042,6822725655.0,8247.48,No,No,Not Required,Obtained,No,242
Chhattisgarh,Janjgir-Champa,National Highway,650.14,487.29,7860,17466918211.0,11390.72,Yes,Yes,Obtained,Under Review,No,1362
Tamil Nadu,Theni,Mining Project,270.92,59.58,3148,2610396249.0,3890.3,Yes,Yes,Pending,Pending,No,345
Gujarat,Chhota Udepur,Port Development,30.23,14.3,362,1272964409.0,1876.35,No,No,Obtained,Under Review,Yes,617
Uttarakhand,Chamoli,Airport,550.18,262.6,6669,17058880698.0,11792.73,Yes,No,Under Review,Obtained,No,1143
Himachal Pradesh,Bilaspur,Power Plant,695.78,85.07,2234,9791691759.0,10396.9,No,No,Not Required,Not Required,Yes,687
Mizoram,Lunglei,Urban Infrastructure,640.5,70.7,4135,2706300255.0,1283.01,No,No,Obtained,Pending,No,594
Madhya Pradesh,Mandsaur,Port Development,211.52,108.25,1956,7241242470.0,5162.78,No,No,Obtained,Not Required,No,773
Rajasthan,Pratapgarh,Railway Line,406.11,201.13,5972,18628462519.0,8544.61,No,No,Obtained,Obtained,Yes,838
Madhya Pradesh,Katni,Railway Line,370.76,92.18,798,945757696.0,943.12,Yes,Yes,Obtained,Pending,Yes,1502
Gujarat,Navsari,Mining Project,59.03,40.09,285,631343562.0,235.2,No,No,Under Review,Under Review,No,281
Gujarat,Junagadh,SEZ,448.04,310.37,2310,2665772984.0,2868.5,No,No,Not Required,Obtained,No,246
Haryana,Hisar,State Highway,527.79,272.34,5494,2670337344.0,3952.98,No,No,Obtained,Not Required,No,252
Madhya Pradesh,Shajapur,Power Plant,419.31,6.0,3416,10801589254.0,7286.01,Yes,Yes,Obtained,Under Review,No,967
West Bengal,Cooch Behar,SEZ,502.63,397.92,3328,11208710803.0,7124.57,Yes,Yes,Pending,Not Required,No,1573
Rajasthan,Tonk,National Highway,474.32,18.51,6109,5778240220.0,2295.56,No,No,Pending,Pending,No,473
Arunachal Pradesh,Papum Pare,Railway Line,150.87,64.86,2016,1243098927.0,1578.27,No,No,Obtained,Not Required,No,150
Jammu and Kashmir,Kishtwar,Industrial Corridor,80.98,56.13,1025,629645235.0,617.92,No,No,Under Review,Obtained,Yes,920
Andhra Pradesh,East Godavari,State Highway,128.61,4.4,819,564727152.0,234.96,No,No,Pending,Not Required,No,498
Sikkim,North Sikkim,Mining Project,603.28,166.96,2152,5082054330.0,4161.34,No,No,Obtained,Not Required,Yes,626
Uttarakhand,Haridwar,Power Plant,50.68,19.52,214,836904964.0,663.69,Yes,Yes,Pending,Pending,Yes,660
Maharashtra,Mumbai Suburban,Port Development,738.2,410.48,6178,21168552641.0,6817.26,No,No,Obtained,Obtained,No,357
Manipur,Imphal West,SEZ,267.76,141.82,2876,11929316752.0,14991.64,No,No,Obtained,Pending,No,595
Arunachal Pradesh,Lohit,Mining Project,91.18,41.25,1045,1690229732.0,1736.63,No,No,Obtained,Pending,Yes,489
Jharkhand,East Singhbhum,Airport,63.6,7.85,371,607924686.0,876.62,Yes,Yes,Obtained,Not Required,No,580
Odisha,Boudh,Mining Project,332.56,16.47,3304,1513262034.0,780.84,No,No,Under Review,Pending,No,287
Goa,North Goa,Railway Line,384.57,246.29,5588,9214077502.0,9905.85,No,No,Obtained,Pending,No,275
Odisha,Jharsuguda,SEZ,465.68,40.3,4513,4177561109.0,4129.27,Yes,No,Obtained,Pending,No,447
Himachal Pradesh,Shimla,Airport,168.33,52.93,749,1457070346.0,1566.94,No,No,Not Required,Obtained,Yes,959
Uttar Pradesh,Kaushambi,Mining Project,557.7,443.78,4357,7058529734.0,2449.11,No,No,Pending,Obtained,Yes,165
Madhya Pradesh,Ratlam,Urban Infrastructure,429.36,31.28,3547,4447723291.0,1812.29,Yes,Yes,Obtained,Obtained,No,512
Uttar Pradesh,Mahoba,Mining Project,513.94,261.98,3256,4713589458.0,6328.59,Yes,Yes,Obtained,Under Review,Yes,429
Bihar,Kaimur (Bhabua),Irrigation/Dam,83.99,21.12,762,3358087231.0,2452.78,No,No,Obtained,Obtained,No,594
Bihar,Lakhisarai,Urban Infrastructure,39.48,6.85,523,1302319738.0,1106.52,No,No,Obtained,Pending,No,628
Uttar Pradesh,Amroha (J.P. Nagar),Railway Line,402.16,3.06,4529,16409885150.0,23083.27,No,No,Obtained,Obtained,Yes,1066
Odisha,Malkangiri,Railway Line,498.66,79.82,7125,26340716608.0,37642.23,Yes,No,Obtained,Obtained,No,664
Maharashtra,Nandurbar,Industrial Corridor,548.82,350.23,2083,6648591838.0,9164.23,No,No,Obtained,Under Review,No,558
Madhya Pradesh,Jabalpur,Power Plant,612.57,224.7,1561,3630303343.0,3792.94,No,No,Under Review,Not Required,No,557
Tamil Nadu,Ramanathapuram,Industrial Corridor,734.83,59.92,10562,26065455284.0,29157.82,No,No,Obtained,Not Required,No,324
Haryana,Karnal,Airport,443.77,237.51,3347,7499380114.0,9429.02,No,No,Obtained,Not Required,Yes,746
Madhya Pradesh,Tikamgarh,Irrigation/Dam,132.47,49.69,1038,3883737117.0,3689.27,No,No,Not Required,Pending,No,418
Jharkhand,Chatra,Airport,556.38,31.67,6805,8421842813.0,8478.61,Yes,Yes,Pending,Obtained,No,1782
Uttar Pradesh,Hathras,Railway Line,316.87,146.41,2583,4553545064.0,3504.57,Yes,No,Obtained,Under Review,No,1271
Kerala,Kasaragod,National Highway,297.35,97.91,3449,3880711825.0,4540.03,Yes,Yes,Under Review,Obtained,No,1275
Gujarat,Aravalli,Airport,555.75,416.98,1965,3121572741.0,2455.12,No,No,Not Required,Not Required,Yes,550
Meghalaya,East Garo Hills,State Highway,327.52,74.87,1110,2925770648.0,1126.74,Yes,Yes,Pending,Obtained,Yes,1013
Haryana,Rewari,State Highway,658.98,505.25,7477,19400450427.0,28862.65,Yes,No,Not Required,Obtained,No,1165
Chhattisgarh,Surguja,National Highway,588.69,65.57,8641,7338091325.0,5464.3,No,No,Obtained,Pending,Yes,319
Punjab,Faridkot,Industrial Corridor,47.05,24.05,483,2082530189.0,746.5,Yes,Yes,Obtained,Obtained,No,512
Odisha,Mayurbhanj,SEZ,224.37,54.37,1896,7536545369.0,6969.99,No,No,Obtained,Under Review,No,364
Madhya Pradesh,Barwani,Airport,694.51,460.84,8886,25089821828.0,31451.08,No,No,Obtained,Not Required,Yes,932
Haryana,Jind,Urban Infrastructure,388.8,219.15,5430,3587004556.0,4654.43,No,No,Obtained,Obtained,No,567
Mizoram,Lawngtlai,Railway Line,228.37,25.97,498,382716734.0,195.01,No,No,Obtained,Pending,No,440
Odisha,Sonepur,Mining Project,586.65,46.85,2236,5844975461.0,3914.37,No,No,Not Required,Pending,Yes,525
Manipur,Jiribam,Power Plant,742.59,560.79,6515,17413025486.0,19395.27,No,No,Obtained,Pending,Yes,323
Rajasthan,Baran,Industrial Corridor,400.08,48.86,4894,18742052869.0,17673.77,Yes,Yes,Under Review,Pending,Yes,588
Gujarat,Botad,Urban Infrastructure,372.59,57.55,4248,8338758504.0,10671.48,No,No,Pending,Obtained,Yes,128
Punjab,Sangrur,Port Development,457.24,186.35,4206,10790274380.0,9320.45,No,No,Obtained,Obtained,Yes,1003
Uttarakhand,Tehri Garhwal,Port Development,101.38,51.2,1198,2897313089.0,3579.38,No,No,Obtained,Obtained,Yes,413
Maharashtra,Mumbai City,Irrigation/Dam,312.29,5.05,2689,8821783351.0,12215.05,No,No,Pending,Obtained,Yes,276
Karnataka,Haveri,SEZ,519.52,279.02,7080,30524531157.0,18985.38,No,No,Obtained,Obtained,Yes,810
Bihar,Kishanganj,Airport,473.14,372.54,2578,2145890808.0,1727.77,Yes,Yes,Obtained,Pending,No,1165
Maharashtra,Hingoli,Railway Line,61.96,11.06,384,1605649897.0,654.32,No,No,Obtained,Obtained,Yes,484
Kerala,Pathanamthitta,Railway Line,503.41,317.84,5126,6127290049.0,6877.8,No,No,Obtained,Not Required,No,591
Uttar Pradesh,Auraiya,Irrigation/Dam,268.98,78.47,3628,5933453580.0,7843.22,No,No,Obtained,Pending,No,651
Bihar,Supaul,Port Development,763.61,159.49,1934,7964230987.0,7852.64,Yes,Yes,Pending,Under Review,No,981
Tamil Nadu,Dharmapuri,Irrigation/Dam,651.44,199.73,7151,31072487755.0,34494.28,No,No,Obtained,Obtained,Yes,213
Tamil Nadu,Tiruvallur,Urban Infrastructure,698.25,232.21,7173,32173411657.0,36253.69,No,No,Pending,Pending,Yes,636
Bihar,Purnia (Purnea),Airport,299.19,66.64,3619,9713008542.0,3904.13,Yes,Yes,Pending,Not Required,Yes,2036
Rajasthan,Chittorgarh,Port Development,528.64,348.49,6916,30070110566.0,26552.22,Yes,No,Obtained,Pending,No,1268
Sikkim,East Sikkim,Port Development,596.32,216.03,5861,4036554193.0,2446.95,Yes,No,Obtained,Obtained,Yes,1351
Manipur,Ukhrul,State Highway,267.61,29.8,1665,3908634581.0,1479.18,Yes,Yes,Not Required,Obtained,Yes,1566
Bihar,Nawada,Industrial Corridor,779.76,113.27,7779,23331838541.0,7734.61,No,No,Not Required,Obtained,Yes,847
Tamil Nadu,Cuddalore,Airport,598.89,189.7,7983,5960018125.0,5609.87,Yes,Yes,Obtained,Pending,No,1625
Meghalaya,South West Khasi Hills,Port Development,672.77,455.19,10069,31357660591.0,14460.05,Yes,Yes,Pending,Pending,No,369
Telangana,Jangaon,Urban Infrastructure,46.24,28.13,451,583261475.0,530.97,No,No,Under Review,Obtained,Yes,731
Bihar,Madhubani,Urban Infrastructure,486.31,350.46,5409,20996274847.0,22699.07,No,No,Pending,Obtained,No,394
Uttar Pradesh,Chandauli,SEZ,622.47,326.48,2399,8263754464.0,11701.64,No,No,Obtained,Under Review,No,59
Uttar Pradesh,Agra,Port Development,138.92,36.52,298,431402535.0,357.54,Yes,No,Not Required,Pending,No,557
Manipur,Noney,Port Development,168.12,129.58,1183,4651795972.0,2042.15,Yes,Yes,Not Required,Not Required,Yes,465
Delhi (NCT),North East  Delhi,SEZ,468.9,311.16,4772,13852592908.0,18138.59,Yes,Yes,Obtained,Under Review,Yes,649
Jharkhand,West Singhbhum,Railway Line,477.05,273.76,5198,12076520464.0,8496.32,Yes,Yes,Obtained,Not Required,No,1506
Punjab,Moga,Port Development,97.0,55.59,951,1531518003.0,2253.5,No,No,Pending,Obtained,No,356
Tamil Nadu,Nagapattinam,National Highway,288.85,194.43,3686,14953074995.0,5059.58,Yes,Yes,Pending,Obtained,Yes,1057
Gujarat,Rajkot,Power Plant,677.04,192.33,4269,18804017508.0,27615.72,No,No,Under Review,Obtained,No,742
Madhya Pradesh,Bhopal,SEZ,299.45,229.15,2661,3363084299.0,4246.77,No,No,Obtained,Pending,No,553
West Bengal,Kolkata,State Highway,344.57,235.03,3624,4525341158.0,6130.88,No,No,Not Required,Not Required,Yes,312
Assam,Bongaigaon,SEZ,572.27,350.46,3643,14756746358.0,5853.9,Yes,Yes,Obtained,Obtained,No,1052
Uttar Pradesh,Aligarh,National Highway,574.55,47.34,4066,6485114898.0,2353.44,Yes,No,Not Required,Under Review,Yes,738
Jammu and Kashmir,Jammu,National Highway,164.53,57.41,979,2854189915.0,2445.22,No,No,Obtained,Not Required,Yes,606
Chhattisgarh,Korea (Koriya),Airport,321.44,90.12,1685,1308375831.0,1547.56,No,No,Obtained,Pending,Yes,697
Karnataka,Davangere,Irrigation/Dam,531.02,143.38,2925,8317717829.0,3864.38,No,No,Obtained,Not Required,Yes,420
Bihar,Saharsa,Industrial Corridor,244.63,154.36,925,1270193273.0,881.19,Yes,No,Obtained,Pending,No,1509
Uttar Pradesh,Mirzapur,Mining Project,676.97,197.85,2028,2652936941.0,1093.97,No,No,Obtained,Obtained,No,458
Uttar Pradesh,Amethi (Chatrapati Sahuji Mahraj Nagar),Airport,324.7,177.61,2292,5103960629.0,1935.52,No,No,Pending,Pending,Yes,684
Madhya Pradesh,Shahdol,State Highway,157.79,20.0,1991,7523309271.0,3358.06,No,No,Obtained,Not Required,No,301
Kerala,Ernakulam,Urban Infrastructure,120.53,31.8,554,1911730501.0,942.72,Yes,Yes,Not Required,Not Required,Yes,1324
Kerala,Palakkad,National Highway,658.58,329.31,8190,17783266163.0,6270.77,No,No,Obtained,Pending,No,494
Nagaland,Mon,Airport,60.98,13.29,738,279563353.0,250.84,No,No,Obtained,Obtained,Yes,613
Gujarat,Surat,State Highway,134.15,81.51,1723,3333070705.0,4585.74,Yes,No,Obtained,Under Review,No,1139
Tamil Nadu,Namakkal,Airport,617.23,218.74,8426,32729231634.0,44133.24,No,No,Obtained,Obtained,No,316
Rajasthan,Sri Ganganagar,Industrial Corridor,798.41,636.09,9556,10113966795.0,14205.02,Yes,Yes,Obtained,Obtained,Yes,1717
Tripura,North Tripura,Industrial Corridor,512.29,85.81,5351,6261945194.0,8603.05,No,No,Obtained,Obtained,No,418
Meghalaya,South Garo Hills,National Highway,491.14,192.36,6394,24812056093.0,9301.86,No,No,Under Review,Obtained,No,354
Gujarat,Dahod,Urban Infrastructure,771.49,77.42,2876,11254373671.0,4978.48,No,No,Obtained,Obtained,No,157
Odisha,Jagatsinghapur,Mining Project,52.42,36.21,685,1524831567.0,770.71,Yes,No,Pending,Not Required,No,1590
Haryana,Panipat,Mining Project,30.99,19.22,178,637081372.0,623.56,No,No,Obtained,Pending,No,462
Odisha,Angul,Airport,34.32,23.57,360,820484089.0,1150.01,Yes,No,Obtained,Obtained,Yes,960
Uttar Pradesh,Sultanpur,National Highway,774.82,71.88,9783,10862021178.0,9068.96,Yes,No,Pending,Obtained,No,626
Gujarat,Sabarkantha (Himmatnagar),Power Plant,42.02,31.12,589,2401417162.0,2344.29,Yes,No,Obtained,Under Review,No,1598
Manipur,Churachandpur,Port Development,24.07,7.21,85,328260915.0,413.44,No,No,Obtained,Obtained,No,385
Telangana,Warangal (Rural),Irrigation/Dam,151.47,1.23,1017,620035263.0,208.34,Yes,Yes,Obtained,Pending,No,196
Punjab,Ferozepur,Railway Line,563.3,88.97,4182,17344137707.0,7629.32,Yes,Yes,Obtained,Not Required,Yes,1614
Telangana,Siddipet,National Highway,252.78,114.09,3659,12690763149.0,8546.29,No,No,Not Required,Obtained,Yes,660
West Bengal,Howrah,State Highway,84.29,41.54,289,103149491.0,133.75,No,No,Obtained,Not Required,Yes,337
Chhattisgarh,Bastar,Port Development,757.97,9.44,6065,8997071347.0,6822.0,No,No,Under Review,Not Required,No,160
Kerala,Alappuzha,SEZ,386.89,132.89,4129,8478518821.0,10152.54,No,No,Obtained,Not Required,No,305
Telangana,Mancherial,Irrigation/Dam,653.94,196.06,8180,10051749713.0,14837.82,No,No,Obtained,Pending,No,366
Punjab,Tarn Taran,State Highway,285.45,5.07,1760,736062525.0,260.67,No,No,Obtained,Not Required,Yes,863
Nagaland,Dimapur,Irrigation/Dam,617.55,237.16,6675,29847278236.0,20174.49,Yes,Yes,Obtained,Pending,No,1695
Maharashtra,Nagpur,Mining Project,209.86,102.89,3147,14034105233.0,20110.37,No,No,Obtained,Obtained,Yes,354
Kerala,Thrissur,Port Development,18.43,4.82,165,494005963.0,514.76,No,No,Pending,Not Required,Yes,512
West Bengal,Hooghly,Airport,134.52,88.49,958,2733032909.0,1047.69,Yes,Yes,Under Review,Under Review,Yes,1224
Telangana,Medak,Railway Line,787.49,227.78,2710,3969769860.0,3574.34,Yes,Yes,Pending,Not Required,No,675
Arunachal Pradesh,Changlang,Mining Project,535.18,288.49,5921,15563540377.0,8251.92,No,No,Obtained,Not Required,Yes,805
Uttar Pradesh,Shamali (Prabuddh Nagar),Power Plant,162.74,38.22,2039,6616165157.0,5973.08,Yes,No,Pending,Pending,Yes,699
Rajasthan,Dungarpur,Port Development,770.84,74.35,10931,19944611343.0,23111.92,No,No,Obtained,Under Review,No,704
Telangana,Khammam,Airport,766.15,417.83,8325,14477741737.0,8884.01,No,No,Obtained,Obtained,No,462
Manipur,Thoubal,Port Development,82.32,45.41,854,3005458869.0,2598.69,No,No,Obtained,Not Required,Yes,680
Uttar Pradesh,Ghaziabad,Railway Line,88.85,0.47,211,886582881.0,613.34,No,No,Obtained,Not Required,No,713
Chhattisgarh,Baloda Bazar,SEZ,668.92,62.25,1666,2856207664.0,3483.34,Yes,Yes,Obtained,Not Required,No,472
Chhattisgarh,Bilaspur,Airport,35.45,2.34,288,1091711244.0,1321.64,No,No,Pending,Under Review,Yes,543
Assam,Morigaon,State Highway,635.14,205.76,8075,33664744620.0,27840.21,No,No,Obtained,Pending,Yes,1005
Haryana,Kurukshetra,Urban Infrastructure,346.49,275.96,1660,2438620158.0,2791.03,No,No,Pending,Not Required,No,369
Puducherry (UT),Yanam,Mining Project,446.87,103.59,5281,4621369131.0,2417.94,No,No,Pending,Obtained,No,627
Punjab,Rupnagar,Industrial Corridor,238.38,95.75,2041,5262188007.0,6690.23,No,No,Obtained,Not Required,No,388
Tamil Nadu,Chennai,State Highway,374.4,83.77,4704,8433905416.0,8456.52,No,No,Obtained,Not Required,No,215
Tamil Nadu,Pudukkottai,SEZ,406.49,297.47,2781,9651043051.0,7072.01,No,No,Obtained,Not Required,No,370
Himachal Pradesh,Sirmaur (Sirmour),National Highway,61.45,5.47,132,239792846.0,163.0,No,No,Not Required,Pending,No,245
Gujarat,Jamnagar,SEZ,558.57,264.42,3294,3532128895.0,3339.68,Yes,Yes,Not Required,Obtained,No,472
Gujarat,Gandhinagar,SEZ,405.6,230.62,5112,17239572969.0,11769.19,No,No,Pending,Obtained,Yes,718
Maharashtra,Yavatmal,Airport,657.11,126.98,8518,4878161830.0,4219.51,Yes,No,Obtained,Pending,Yes,542
Uttar Pradesh,Allahabad,Mining Project,340.24,2.92,2171,2403378723.0,2650.3,Yes,No,Not Required,Not Required,Yes,599
Bihar,Bhagalpur,Irrigation/Dam,130.59,58.32,847,2344327584.0,2500.76,No,No,Obtained,Not Required,Yes,744
Tripura,Khowai,SEZ,313.55,29.49,3688,6903632054.0,6369.78,Yes,No,Pending,Pending,No,1335
Gujarat,Bharuch,Railway Line,605.02,61.4,1853,4032760810.0,4615.57,Yes,Yes,Obtained,Pending,No,1385
Karnataka,Chikballapur,Airport,8.28,1.76,40,159333503.0,107.47,Yes,Yes,Obtained,Obtained,Yes,1326
Rajasthan,Jaipur,Urban Infrastructure,244.21,12.44,2890,4477119189.0,5960.39,Yes,Yes,Obtained,Not Required,No,179
Uttarakhand,Bageshwar,SEZ,171.62,75.52,1589,2977373977.0,2956.56,Yes,No,Obtained,Not Required,No,965
Gujarat,Panchmahal (Godhra),Mining Project,332.01,261.17,3781,9641928222.0,6209.65,No,No,Pending,Pending,No,166
Jammu and Kashmir,Leh,Railway Line,774.88,374.27,2042,3175577474.0,4077.78,Yes,No,Not Required,Pending,No,362
Assam,West Karbi Anglong,Port Development,696.33,10.71,3554,6782729268.0,9002.14,No,No,Obtained,Pending,No,631
Madhya Pradesh,Chhatarpur,Power Plant,418.21,209.1,1953,7183145800.0,5679.1,Yes,Yes,Pending,Obtained,No,1562
Chhattisgarh,Bijapur,Railway Line,708.28,39.4,5236,10289298445.0,7704.15,No,No,Obtained,Obtained,Yes,467
Arunachal Pradesh,Lower Dibang Valley,State Highway,781.08,118.24,10512,4247927792.0,5029.03,Yes,No,Not Required,Not Required,No,945
Uttar Pradesh,Basti,Railway Line,740.92,35.4,10829,20220001608.0,17944.47,No,No,Pending,Pending,Yes,745
Daman and Diu (UT),Daman,Mining Project,703.87,283.03,2231,4354057914.0,3695.19,Yes,Yes,Obtained,Obtained,No,1604
West Bengal,Burdwan (Bardhaman),National Highway,6.11,3.19,60,111015761.0,44.39,No,No,Pending,Not Required,No,553
Madhya Pradesh,Burhanpur,State Highway,111.44,46.61,559,2184585214.0,1397.96,No,No,Obtained,Obtained,No,416
Karnataka,Yadgir,Mining Project,501.21,284.45,3252,10159149122.0,15011.19,No,No,Under Review,Pending,No,373
Karnataka,Raichur,National Highway,33.49,12.08,426,1544458654.0,2248.43,No,No,Not Required,Pending,No,505
Tamil Nadu,Dindigul,Railway Line,387.49,265.0,1992,7642859348.0,10163.68,No,No,Obtained,Not Required,Yes,297
Chhattisgarh,Mungeli,Railway Line,569.08,204.87,3286,5125562108.0,2506.43,No,No,Pending,Obtained,Yes,340
Delhi (NCT),West Delhi,Urban Infrastructure,184.41,113.18,609,1027525030.0,890.75,No,No,Obtained,Under Review,No,518
Haryana,Ambala,Port Development,419.28,105.55,1762,2518707898.0,1566.86,Yes,Yes,Obtained,Obtained,No,928
Nagaland,Mokokchung,State Highway,395.92,22.62,3933,4127514830.0,3675.42,Yes,No,Obtained,Pending,No,573
Jammu and Kashmir,Shopian,Railway Line,748.49,5.06,3187,4122431532.0,2809.87,No,No,Obtained,Pending,No,613
Telangana,Bhadradri Kothagudem,Urban Infrastructure,147.9,116.08,1808,2405009043.0,2757.92,No,No,Obtained,Not Required,No,377
Tamil Nadu,Madurai,Power Plant,535.31,372.96,2458,6990910451.0,2943.76,No,No,Under Review,Obtained,Yes,225
Maharashtra,Sangli,State Highway,76.9,30.72,333,918707182.0,1261.56,No,No,Obtained,Obtained,Yes,670
Uttar Pradesh,Hardoi,Mining Project,663.17,418.8,7642,28304121228.0,32280.54,Yes,No,Obtained,Pending,Yes,1524
Odisha,Nuapada,State Highway,285.73,124.37,1189,4971628586.0,5738.13,Yes,No,Not Required,Not Required,No,476
Andhra Pradesh,YSR Kadapa,Irrigation/Dam,698.58,322.39,3320,8515944662.0,10014.05,Yes,Yes,Under Review,Pending,No,1234
Uttarakhand,Uttarkashi,SEZ,441.0,267.32,6328,5626061492.0,7226.74,No,No,Obtained,Obtained,Yes,550
Jammu and Kashmir,Kulgam,Industrial Corridor,257.86,150.19,766,881967061.0,1090.04,No,No,Obtained,Obtained,No,512
Tripura,Dhalai,Mining Project,99.2,9.31,367,402412833.0,377.89,No,No,Obtained,Pending,No,268
Uttar Pradesh,Moradabad,Mining Project,746.29,515.58,6322,20088229783.0,22340.7,No,No,Obtained,Obtained,Yes,796
Uttar Pradesh,Maharajganj,Industrial Corridor,338.65,229.34,5046,10703746522.0,3543.92,No,No,Obtained,Obtained,Yes,729
Andhra Pradesh,Nellore,SEZ,730.94,253.09,8283,9881879790.0,8884.58,No,No,Pending,Obtained,Yes,854
Jammu and Kashmir,Samba,Industrial Corridor,289.16,96.24,1453,1410026355.0,842.39,Yes,Yes,Not Required,Not Required,No,793
Uttar Pradesh,Jaunpur,Industrial Corridor,589.58,467.36,6743,18326562395.0,20415.45,No,No,Obtained,Under Review,No,149
Assam,Hailakandi,Power Plant,198.87,85.16,1975,3736216278.0,1249.54,No,No,Obtained,Obtained,No,550
Uttar Pradesh,Lucknow,Railway Line,71.19,42.48,536,1724293003.0,1626.16,Yes,No,Under Review,Not Required,Yes,1594
Manipur,Kamjong,Mining Project,220.84,161.34,2959,5505666377.0,7131.76,Yes,Yes,Obtained,Pending,Yes,733
Uttar Pradesh,Sonbhadra,Airport,594.33,303.64,7205,18165394907.0,13549.76,No,No,Obtained,Pending,No,117
Assam,Goalpara,Railway Line,530.91,395.44,5531,1953211979.0,1570.52,No,No,Obtained,Pending,No,495
Odisha,Kalahandi,Irrigation/Dam,386.02,62.38,4893,10765841582.0,6336.92,No,No,Obtained,Not Required,No,308
Uttar Pradesh,Jalaun,Irrigation/Dam,262.12,43.77,3474,1831902299.0,2604.03,Yes,Yes,Pending,Pending,No,460
Nagaland,Kiphire,Airport,581.57,348.06,1420,4120085042.0,1517.26,No,No,Not Required,Obtained,No,136
Jharkhand,Sahibganj,Irrigation/Dam,134.99,11.39,1584,5057984857.0,3247.65,No,No,Obtained,Pending,No,515
Manipur,Tamenglong,Airport,252.55,21.77,2279,1169240885.0,391.45,No,No,Obtained,Pending,Yes,743
Tamil Nadu,Tiruvarur,Power Plant,298.82,169.83,2628,2087991455.0,1390.41,No,No,Obtained,Obtained,Yes,755
Madhya Pradesh,Sagar,Port Development,706.32,318.07,3707,12243255432.0,13163.81,No,No,Obtained,Obtained,No,478
Delhi (NCT),North West  Delhi,Urban Infrastructure,125.39,31.05,919,3266938091.0,4588.82,No,No,Pending,Obtained,Yes,777
Chhattisgarh,Dhamtari,Mining Project,462.16,104.06,2674,819768744.0,593.0,No,No,Obtained,Not Required,No,470
Andhra Pradesh,Prakasam,SEZ,718.77,345.35,3486,15650947604.0,14264.77,Yes,Yes,Obtained,Pending,No,1077
Rajasthan,Dholpur,Irrigation/Dam,144.25,3.47,1112,1521310371.0,1532.53,No,No,Obtained,Under Review,Yes,1051
Telangana,Jagtial,State Highway,127.61,4.88,1380,755464006.0,1097.95,Yes,No,Obtained,Obtained,Yes,1118
Jammu and Kashmir,Reasi,Mining Project,386.35,67.55,2500,6689336708.0,4588.39,Yes,Yes,Pending,Obtained,No,829
Bihar,Katihar,Railway Line,515.16,166.03,1173,4228122229.0,2504.24,Yes,Yes,Obtained,Not Required,Yes,848
Meghalaya,West Jaintia Hills,Airport,342.69,272.12,2904,9786004314.0,11298.49,Yes,No,Pending,Obtained,Yes,1422
Manipur,Pherzawl,Power Plant,597.72,467.43,7089,21147717499.0,11669.62,Yes,Yes,Pending,Not Required,No,676
Tamil Nadu,Thanjavur,Mining Project,168.08,61.26,2058,6253347769.0,7109.84,No,No,Not Required,Pending,Yes,258
Jharkhand,Latehar,Airport,472.41,91.32,6715,28100249087.0,27403.94,Yes,Yes,Pending,Obtained,No,1200
Maharashtra,Wardha,Railway Line,151.95,114.87,993,904198540.0,306.45,No,No,Pending,Obtained,Yes,571
Odisha,Ganjam,Airport,120.23,6.94,951,1832374700.0,849.65,No,No,Pending,Under Review,Yes,450
Odisha,Bargarh,National Highway,444.96,199.82,6244,2940520365.0,1234.91,No,No,Pending,Not Required,Yes,333
Uttar Pradesh,Gorakhpur,SEZ,474.1,307.27,3340,6945642484.0,8512.14,No,No,Under Review,Obtained,No,412
Gujarat,Tapi (Vyara),Port Development,444.66,222.18,1962,5416445349.0,4095.31,No,No,Obtained,Obtained,Yes,487
Mizoram,Serchhip,Airport,286.29,35.67,2844,8641997052.0,5419.47,Yes,No,Obtained,Pending,No,1787
Uttar Pradesh,Bareilly,SEZ,307.46,170.74,1746,4646100455.0,4074.69,Yes,No,Obtained,Under Review,Yes,1658
Delhi (NCT),South West  Delhi,Mining Project,208.87,87.04,966,2474918352.0,3513.47,No,No,Obtained,Pending,No,478
Maharashtra,Kolhapur,National Highway,421.0,249.68,3485,11729391492.0,5508.32,No,No,Obtained,Pending,No,174
Nagaland,Zunheboto,State Highway,49.56,8.41,126,100344618.0,127.29,No,No,Obtained,Not Required,No,343
Karnataka,Belagavi (Belgaum),State Highway,677.11,86.32,9069,9620128597.0,4012.78,Yes,Yes,Not Required,Not Required,Yes,2070
Assam,Lakhimpur,Port Development,69.54,42.29,638,610844796.0,482.7,No,No,Obtained,Obtained,Yes,644
Tamil Nadu,Sivaganga,Port Development,324.59,82.87,2985,4710797739.0,5611.68,No,No,Obtained,Obtained,No,405
Madhya Pradesh,Ujjain,State Highway,259.95,194.79,3788,14167153645.0,7478.04,No,No,Not Required,Obtained,Yes,593
Haryana,Faridabad,Power Plant,303.96,44.62,2160,1681190336.0,1641.89,No,No,Pending,Not Required,No,513
Maharashtra,Beed,National Highway,360.76,174.0,4127,18276077698.0,18548.67,No,No,Under Review,Obtained,Yes,492
Lakshadweep (UT),Bithra,Urban Infrastructure,204.3,131.17,1950,8378111833.0,6104.01,No,No,Obtained,Obtained,Yes,671
Arunachal Pradesh,Lower Siang,Railway Line,250.07,20.21,3088,12089368208.0,16667.73,Yes,Yes,Obtained,Not Required,No,992
Delhi (NCT),Shahdara,Urban Infrastructure,422.75,232.09,1797,7423265892.0,5276.4,No,No,Not Required,Not Required,No,733
Maharashtra,Parbhani,Industrial Corridor,612.81,482.89,3375,6867399015.0,8177.97,No,No,Not Required,Obtained,No,701
Punjab,Nawanshahr (Shahid Bhagat Singh Nagar),SEZ,294.15,188.47,1354,5206026966.0,4087.5,Yes,Yes,Obtained,Not Required,No,1612
Bihar,Jehanabad,Industrial Corridor,595.1,402.51,4399,3149203919.0,2794.03,No,No,Under Review,Obtained,Yes,801
Punjab,Sahibzada Ajit Singh Nagar (Mohali),State Highway,683.04,304.61,1685,1757203137.0,1917.62,No,No,Not Required,Obtained,No,506
Manipur,Senapati,State Highway,96.0,3.2,890,649678845.0,617.87,No,No,Obtained,Under Review,No,441
Karnataka,Uttara Kannada (Karwar),Industrial Corridor,143.05,21.14,478,1463440788.0,1503.53,Yes,No,Obtained,Pending,No,781
Bihar,Muzaffarpur,Airport,596.95,299.6,2203,1215879997.0,1760.53,No,No,Pending,Pending,No,376
Chhattisgarh,Gariyaband,Railway Line,504.46,92.21,5830,9891050645.0,3493.55,No,No,Not Required,Obtained,No,681
Kerala,Kollam,Airport,345.66,122.61,1275,3509745339.0,2126.97,Yes,No,Obtained,Obtained,Yes,663
Assam,Karbi Anglong,State Highway,86.56,68.4,493,1139125640.0,807.47,No,No,Obtained,Not Required,Yes,693
Punjab,Bathinda,Railway Line,383.45,93.79,1363,3342905592.0,3310.53,No,No,Obtained,Obtained,Yes,674
Telangana,Jayashankar Bhoopalpally,SEZ,27.98,8.2,388,146747768.0,141.6,No,No,Obtained,Not Required,No,431
Sikkim,West Sikkim,Railway Line,778.75,201.58,8113,26750743631.0,37900.48,No,No,Pending,Obtained,No,315
Odisha,Nayagarh,Railway Line,534.35,200.84,4878,10846866099.0,10637.54,No,No,Obtained,Not Required,Yes,509
Uttar Pradesh,Budaun,SEZ,483.71,18.66,6259,2202022775.0,2697.84,No,No,Under Review,Pending,No,268
Assam,Kamrup,Urban Infrastructure,784.51,105.04,4590,8334065251.0,5523.16,No,No,Obtained,Obtained,Yes,603
Chhattisgarh,Surajpur  ,Industrial Corridor,765.54,316.66,9539,30305036063.0,19908.0,Yes,Yes,Obtained,Pending,Yes,1549
Gujarat,Surendranagar,Industrial Corridor,352.49,45.49,2265,7995050780.0,11559.48,No,No,Not Required,Obtained,Yes,848
Uttar Pradesh,Gautam Buddha Nagar,State Highway,638.47,356.85,6863,17876302983.0,24128.41,Yes,Yes,Obtained,Not Required,Yes,943
Karnataka,Chitradurga,National Highway,583.1,405.28,6730,18687257668.0,9395.61,No,No,Pending,Obtained,No,585
Gujarat,Narmada (Rajpipla),Irrigation/Dam,393.21,26.14,3557,10655348294.0,3947.58,Yes,No,Under Review,Not Required,No,1201
West Bengal,Nadia,Industrial Corridor,623.34,425.57,2444,5318438867.0,6681.13,No,No,Not Required,Obtained,No,225
Manipur,Bishnupur,Airport,585.13,173.68,8679,20234086331.0,22791.37,No,No,Under Review,Obtained,No,497
Telangana,Medchal,Mining Project,598.05,417.47,8454,32911520301.0,44667.64,No,No,Obtained,Not Required,Yes,960
Uttarakhand,Dehradun,Urban Infrastructure,87.93,31.45,212,677107459.0,600.14,Yes,Yes,Under Review,Obtained,Yes,1921
Jammu and Kashmir,Srinagar,Industrial Corridor,452.67,293.97,6719,26895019551.0,23954.64,Yes,Yes,Obtained,Obtained,Yes,1567
Karnataka,Kodagu,Urban Infrastructure,353.34,109.87,4285,12288117472.0,16405.75,No,No,Pending,Not Required,No,486
Chhattisgarh,Durg,Port Development,408.33,3.81,3758,7290165533.0,6299.88,No,No,Under Review,Obtained,Yes,510
Bihar,Siwan,Mining Project,284.79,210.93,2279,1043669033.0,774.91,Yes,Yes,Under Review,Obtained,No,1201
Telangana,Nizamabad,State Highway,90.73,55.28,583,308184301.0,215.82,No,No,Under Review,Not Required,No,458
Madhya Pradesh,Chhindwara,Port Development,793.48,382.49,3688,9658284808.0,9359.6,Yes,Yes,Obtained,Under Review,No,1615
Himachal Pradesh,Solan,Port Development,471.95,372.35,2267,9464346442.0,13613.67,No,No,Obtained,Not Required,No,360
Rajasthan,Sawai Madhopur,Irrigation/Dam,492.28,93.9,2672,4314326969.0,5915.83,Yes,No,Not Required,Obtained,No,1485
Jammu and Kashmir,Rajouri,Power Plant,658.24,318.59,1568,4969766985.0,2521.5,Yes,Yes,Obtained,Not Required,Yes,1850
Uttar Pradesh,Sitapur,Industrial Corridor,597.08,376.41,4858,19993702824.0,8415.63,Yes,No,Obtained,Obtained,Yes,328
Assam,Kokrajhar,Port Development,363.16,161.91,4787,21341074504.0,14222.89,No,No,Pending,Not Required,No,295
Maharashtra,Gadchiroli,SEZ,540.54,1.14,7904,27363085651.0,27097.82,Yes,Yes,Not Required,Obtained,Yes,1304
Jammu and Kashmir,Udhampur,Industrial Corridor,734.73,469.37,2715,8989739826.0,12608.44,No,No,Obtained,Obtained,No,369
Karnataka,Kalaburagi (Gulbarga),Port Development,553.47,231.02,4141,16653943862.0,8329.21,Yes,No,Under Review,Not Required,Yes,1993
Jharkhand,Garhwa,Power Plant,715.11,169.05,5439,16563211217.0,17039.92,No,No,Obtained,Obtained,No,625
Arunachal Pradesh,West Kameng,SEZ,536.84,337.46,1997,8445632141.0,8321.07,No,No,Not Required,Not Required,Yes,670
Jharkhand,Gumla,SEZ,708.97,357.66,5526,7768688750.0,6666.08,Yes,Yes,Obtained,Not Required,No,539
Madhya Pradesh,Datia,Airport,771.83,614.2,2457,2236802261.0,3156.2,No,No,Obtained,Obtained,Yes,616
Bihar,Madhepura,Mining Project,63.43,46.64,628,361643459.0,227.84,No,No,Pending,Obtained,No,577
Telangana,Rangareddy,State Highway,637.16,61.2,6403,11054070013.0,15753.18,No,No,Obtained,Obtained,Yes,368
Bihar,Munger (Monghyr),State Highway,321.99,69.65,1952,3147793246.0,1907.15,No,No,Pending,Pending,Yes,358
Uttar Pradesh,Shahjahanpur,SEZ,235.13,96.7,2796,3748146084.0,1810.34,No,No,Obtained,Not Required,No,762
Uttarakhand,Udham Singh Nagar,State Highway,601.04,297.56,7030,27376557877.0,21244.46,Yes,Yes,Under Review,Obtained,No,1144
Lakshadweep (UT),Amini,Irrigation/Dam,318.29,115.21,988,1168035475.0,1389.63,No,No,Obtained,Under Review,No,207
Telangana,Jogulamba Gadwal,National Highway,359.56,44.22,3058,10972417957.0,5166.26,No,No,Obtained,Obtained,No,420
Tripura,South Tripura,Irrigation/Dam,257.03,127.0,1114,1428058522.0,1534.34,No,No,Obtained,Not Required,No,489
Assam,Darrang,State Highway,273.31,26.32,1535,6592912961.0,5313.08,No,No,Obtained,Not Required,Yes,739
Assam,Chirang,Industrial Corridor,784.67,292.45,10820,30143975296.0,33025.73,Yes,Yes,Not Required,Obtained,Yes,1118
Rajasthan,Sikar,Urban Infrastructure,123.15,75.87,303,422061016.0,484.17,No,No,Under Review,Under Review,Yes,912
Uttar Pradesh,Balrampur,Power Plant,441.33,72.3,2055,4996081281.0,4054.26,No,No,Obtained,Obtained,No,528
Bihar,West Champaran,Power Plant,271.05,145.35,2508,4824312707.0,2906.14,No,No,Under Review,Pending,Yes,363
Haryana,Sonipat,Port Development,735.42,4.42,9760,8129399808.0,10887.66,Yes,No,Not Required,Not Required,No,1333
Jharkhand,Deoghar,Railway Line,30.74,9.78,429,1871998591.0,1057.82,No,No,Under Review,Obtained,No,371
Haryana,Jhajjar,National Highway,210.7,82.48,1842,5043721741.0,4994.71,No,No,Obtained,Not Required,No,470
Bihar,Araria,SEZ,784.75,316.83,1947,4691535651.0,4730.08,No,No,Not Required,Pending,No,308
Jammu and Kashmir,Ramban,Industrial Corridor,401.62,37.66,3304,2208494420.0,1677.61,No,No,Pending,Not Required,Yes,492
Telangana,Mahabubabad,Railway Line,630.91,177.11,1897,815671275.0,1059.15,No,No,Pending,Pending,No,595
Uttarakhand,Almora,SEZ,185.41,37.21,1514,3734230239.0,4642.28,No,No,Pending,Pending,No,427
Meghalaya,North Garo Hills,Airport,529.83,385.49,6687,26925195159.0,37261.97,No,No,Obtained,Obtained,Yes,769
Madhya Pradesh,Gwalior,State Highway,203.86,90.88,1407,3280062505.0,1941.56,Yes,No,Pending,Not Required,No,1147
Tamil Nadu,Erode,National Highway,722.42,150.97,5626,13149068727.0,4254.43,No,No,Obtained,Obtained,No,383
Tamil Nadu,Viluppuram,Industrial Corridor,110.58,76.21,1136,3974921800.0,4375.06,Yes,No,Obtained,Pending,No,1053
Uttar Pradesh,Mathura,Railway Line,148.63,23.06,1606,5802058939.0,5581.62,No,No,Obtained,Pending,Yes,1240
Rajasthan,Rajsamand,Power Plant,76.27,17.68,581,809742747.0,547.32,No,No,Obtained,Under Review,Yes,768
Gujarat,Morbi,Mining Project,401.94,111.06,4382,6050544578.0,7780.46,No,No,Pending,Pending,Yes,424
Chhattisgarh,Balod,Mining Project,538.01,211.55,1203,1921476706.0,2769.62,Yes,No,Obtained,Under Review,Yes,966
Karnataka,Kolar,Mining Project,41.55,24.54,252,821314958.0,914.55,No,No,Pending,Pending,No,693
Punjab,Gurdaspur,National Highway,569.37,442.4,7168,8844616421.0,11747.23,Yes,Yes,Obtained,Obtained,Yes,1567
Punjab,Ludhiana,SEZ,779.0,561.7,3725,9005635028.0,10350.24,No,No,Pending,Pending,No,376
Uttar Pradesh,Saharanpur,Industrial Corridor,526.74,236.25,2011,6913380747.0,2122.22,No,No,Pending,Obtained,Yes,687
Haryana,Mahendragarh,Power Plant,95.59,25.18,799,3481122255.0,2353.53,No,No,Obtained,Obtained,Yes,754
Chhattisgarh,Raipur,Irrigation/Dam,348.93,24.92,949,779581395.0,377.02,Yes,Yes,Pending,Obtained,No,728
Jammu and Kashmir,Budgam,Mining Project,715.94,186.65,2505,8545245985.0,2589.91,No,No,Obtained,Obtained,Yes,277
Odisha,Gajapati,SEZ,163.01,42.14,1016,3628843310.0,2508.83,Yes,No,Not Required,Pending,Yes,1487
Odisha,Kendujhar (Keonjhar),National Highway,631.22,464.09,8490,28782758076.0,10527.98,No,No,Pending,Not Required,Yes,978
Mizoram,Mamit,SEZ,582.17,387.83,5536,21234428269.0,7754.62,Yes,No,Obtained,Pending,No,1229
Jammu and Kashmir,Kargil,Mining Project,746.26,582.73,6746,20042067327.0,22690.69,Yes,Yes,Not Required,Pending,No,759
Lakshadweep (UT),Minicoy,Port Development,37.13,7.09,186,262315778.0,152.36,No,No,Pending,Not Required,Yes,299
Chandigarh (UT),Chandigarh,Port Development,774.32,186.78,5494,15378657331.0,21923.85,Yes,Yes,Not Required,Not Required,No,1583
Meghalaya,West Khasi Hills,Urban Infrastructure,387.82,96.03,1491,5026804171.0,7441.15,No,No,Not Required,Pending,Yes,527
Chhattisgarh,Kanker (North Bastar),Port Development,265.7,149.72,2071,6863675535.0,3431.66,No,No,Obtained,Not Required,No,565
Rajasthan,Bundi,Power Plant,157.57,95.1,2009,4519186724.0,4391.7,No,No,Pending,Obtained,Yes,229
Madhya Pradesh,Ashoknagar,Power Plant,385.82,126.3,4018,8139570660.0,4821.92,Yes,Yes,Obtained,Pending,No,399
Assam,Dima Hasao,Industrial Corridor,260.24,186.42,1064,2158759577.0,1931.15,No,No,Obtained,Not Required,Yes,495
Uttarakhand,Pithoragarh,SEZ,315.92,44.63,4122,8422159377.0,4341.57,No,No,Obtained,Pending,No,549
Maharashtra,Sindhudurg,Power Plant,306.05,151.65,3668,15154201409.0,14829.75,No,No,Obtained,Not Required,Yes,612
Odisha,Kandhamal,Industrial Corridor,519.87,378.16,4282,6766903389.0,7741.1,No,No,Pending,Obtained,No,267
Jharkhand,Koderma,Airport,320.9,173.0,1794,3990322728.0,5379.59,No,No,Pending,Pending,No,325
Madhya Pradesh,Dindori,Irrigation/Dam,319.14,105.68,2786,9458713130.0,3616.45,Yes,Yes,Not Required,Under Review,Yes,1107
Mizoram,Champhai,Port Development,725.31,247.21,4576,8155535159.0,12015.65,Yes,Yes,Pending,Pending,Yes,1451
Uttar Pradesh,Hamirpur,Industrial Corridor,12.3,1.45,75,279586607.0,183.46,Yes,Yes,Obtained,Obtained,No,1752
Punjab,Fazilka,Mining Project,301.55,124.26,1937,7990724520.0,3379.29,Yes,Yes,Obtained,Not Required,No,1576
Punjab,Fatehgarh Sahib,Power Plant,698.59,96.78,7617,11916824665.0,13377.02,No,No,Obtained,Pending,No,306
Maharashtra,Gondia,Irrigation/Dam,213.73,102.84,1634,5279545779.0,6411.69,No,No,Obtained,Pending,No,546
Odisha,Balasore,Industrial Corridor,780.8,264.87,2955,11267396642.0,14103.65,No,No,Pending,Obtained,Yes,583
Himachal Pradesh,Hamirpur,Industrial Corridor,743.9,501.1,5902,26356682999.0,21437.45,No,No,Under Review,Not Required,Yes,570
Odisha,Sundargarh,Airport,181.6,9.35,1019,402203697.0,380.52,No,No,Pending,Obtained,No,385
Tamil Nadu,Perambalur,Power Plant,587.38,423.25,6115,10428225073.0,4852.53,No,No,Obtained,Pending,No,419
Maharashtra,Amravati,Mining Project,369.68,99.0,4982,4984984912.0,2574.62,No,No,Obtained,Obtained,No,477
Jharkhand,Hazaribag,State Highway,776.71,254.93,7143,27367319471.0,35087.26,No,No,Pending,Not Required,No,394
Telangana,Peddapalli,State Highway,73.0,54.86,177,285991931.0,376.72,Yes,Yes,Under Review,Pending,Yes,1757
Uttar Pradesh,Bahraich,SEZ,520.2,296.12,1200,4628551622.0,3228.53,Yes,Yes,Under Review,Not Required,Yes,1944
Uttar Pradesh,Kanshiram Nagar (Kasganj),Airport,318.07,46.45,3875,9789676681.0,3687.95,No,No,Pending,Not Required,No,228
Arunachal Pradesh,East Kameng,SEZ,331.83,36.15,897,2730928206.0,2936.88,Yes,No,Not Required,Obtained,Yes,1628
Maharashtra,Jalna,Mining Project,759.41,44.51,10095,37801359619.0,11963.37,No,No,Obtained,Pending,Yes,426
Gujarat,Bhavnagar,Mining Project,265.85,102.01,933,1084786261.0,1084.54,Yes,Yes,Not Required,Pending,No,1107
Puducherry (UT),Mahe,State Highway,74.64,16.25,580,2591966696.0,3277.34,Yes,No,Under Review,Pending,No,740
Chhattisgarh,Balrampur,Port Development,294.62,66.09,4302,12323082325.0,14823.06,No,No,Obtained,Obtained,No,477
Uttar Pradesh,Azamgarh,Power Plant,405.22,95.75,880,342404651.0,414.56,Yes,Yes,Obtained,Obtained,Yes,918
Bihar,Saran,State Highway,21.58,11.66,267,773265670.0,1004.03,No,No,Obtained,Not Required,Yes,978
Odisha,Khordha,Industrial Corridor,295.63,195.05,2738,1591941210.0,1832.65,Yes,No,Obtained,Obtained,No,1356
Uttar Pradesh,Chitrakoot,Railway Line,422.34,116.73,4869,4950136411.0,3710.53,No,No,Obtained,Obtained,No,483
Bihar,Khagaria,Irrigation/Dam,631.97,204.26,3541,15696963182.0,23310.5,No,No,Not Required,Obtained,No,252
West Bengal,South 24 Parganas,Urban Infrastructure,562.61,151.79,1664,6351881065.0,8540.56,Yes,Yes,Obtained,Obtained,No,983
Bihar,Darbhanga,Power Plant,31.52,16.02,116,477970670.0,330.79,No,No,Obtained,Not Required,No,577
Madhya Pradesh,Anuppur,Urban Infrastructure,66.29,18.91,314,340691205.0,250.29,No,No,Obtained,Obtained,No,526
Jammu and Kashmir,Kathua,Airport,786.58,365.09,11401,49990520967.0,23537.95,Yes,Yes,Obtained,Not Required,No,922
Bihar,Banka,State Highway,357.72,87.57,4916,2424384728.0,3043.51,Yes,Yes,Obtained,Pending,No,500
Uttar Pradesh,Muzaffarnagar,Railway Line,600.99,363.37,6975,29948189482.0,38574.35,No,No,Pending,Pending,No,335
Bihar,Arwal,Port Development,697.39,16.76,2073,7426328101.0,4589.67,No,No,Obtained,Obtained,Yes,895
Maharashtra,Ahmednagar,State Highway,291.94,59.91,3963,14871202553.0,18635.1,Yes,Yes,Pending,Not Required,No,478
Bihar,Jamui,Airport,97.76,74.66,242,1084860584.0,476.63,Yes,Yes,Obtained,Pending,No,1778
Jharkhand,Dhanbad,SEZ,510.77,15.09,6477,20170046418.0,23702.69,Yes,Yes,Obtained,Not Required,Yes,245
Haryana,Kaithal,Railway Line,82.61,18.37,651,378968081.0,134.01,No,No,Obtained,Obtained,Yes,597
Gujarat,Amreli,State Highway,590.61,98.86,5540,19282455033.0,9845.5,No,No,Not Required,Not Required,No,488
Karnataka,Mandya,Port Development,747.83,295.8,6057,14430843138.0,7193.55,No,No,Obtained,Obtained,Yes,767
Jharkhand,Khunti,Mining Project,647.73,452.8,4860,21630770061.0,17790.7,No,No,Pending,Not Required,Yes,321
Karnataka,Bagalkot,SEZ,416.25,252.98,1139,4442925219.0,5651.56,No,No,Obtained,Obtained,Yes,688
Bihar,Sitamarhi,National Highway,739.7,257.72,7588,22179659302.0,29656.34,No,No,Obtained,Obtained,No,526
Goa,South Goa,Power Plant,747.47,576.25,9620,34722761290.0,18179.93,No,No,Not Required,Obtained,Yes,432
Punjab,Mansa,Urban Infrastructure,175.35,108.36,607,2692271746.0,1207.05,Yes,Yes,Not Required,Not Required,No,270
Madhya Pradesh,Neemuch,Railway Line,625.87,30.66,7336,18251453782.0,15337.54,Yes,No,Obtained,Obtained,Yes,1622
Haryana,Palwal,Railway Line,391.9,145.04,5466,23005949824.0,11684.3,Yes,Yes,Obtained,Not Required,No,984
Daman and Diu (UT),Diu,State Highway,11.5,8.21,43,60663806.0,44.83,No,No,Obtained,Obtained,No,472
Uttar Pradesh,Kannauj,Port Development,393.46,98.21,5669,17243665223.0,12940.44,No,No,Not Required,Not Required,No,569
Bihar,Buxar,Urban Infrastructure,487.62,252.66,5010,14567791855.0,16218.58,No,No,Pending,Not Required,No,488
Maharashtra,Palghar,SEZ,552.07,231.16,4709,13372568239.0,15437.6,No,No,Not Required,Pending,Yes,345
Rajasthan,Jhunjhunu,National Highway,212.24,53.07,2705,9894945196.0,5327.4,No,No,Obtained,Not Required,No,359
West Bengal,Birbhum,State Highway,41.26,25.14,103,94985137.0,129.21,No,No,Obtained,Not Required,No,452
Tamil Nadu,Tiruchirappalli,Power Plant,460.09,366.15,2947,3806371054.0,4548.27,No,No,Pending,Under Review,No,542
Arunachal Pradesh,Tirap,Mining Project,667.81,371.9,3160,11376591158.0,11695.07,Yes,Yes,Pending,Pending,No,512
Maharashtra,Latur,Port Development,230.79,38.92,2315,1210647873.0,1314.41,Yes,Yes,Obtained,Not Required,No,373
Haryana,Mewat,Railway Line,735.35,241.1,7895,12753426114.0,7477.17,Yes,Yes,Obtained,Pending,No,1490
Assam,Tinsukia,Power Plant,335.31,138.82,2729,6054295193.0,2867.13,Yes,Yes,Pending,Obtained,Yes,1455
West Bengal,Alipurduar,Airport,549.33,57.02,8036,7997238549.0,9603.67,No,No,Not Required,Pending,Yes,178
Telangana,Rajanna Sircilla,Urban Infrastructure,543.66,191.69,3171,6031600428.0,2503.09,No,No,Obtained,Pending,No,316
Rajasthan,Barmer,SEZ,222.33,77.12,1979,4143718739.0,2970.13,Yes,No,Pending,Obtained,No,903
Arunachal Pradesh,Tawang,Power Plant,183.63,97.24,1771,2242939404.0,1265.6,Yes,Yes,Obtained,Under Review,No,396
Maharashtra,Jalgaon,Irrigation/Dam,790.18,242.6,11751,25350225976.0,12040.91,Yes,No,Obtained,Pending,No,229
Madhya Pradesh,Seoni,Railway Line,252.7,40.54,3783,8502197026.0,10625.28,Yes,No,Under Review,Obtained,No,525
Maharashtra,Pune,Port Development,694.09,62.42,5246,18676294150.0,19227.54,No,No,Pending,Pending,No,697
Meghalaya,Ri Bhoi,National Highway,464.46,298.86,5043,8218629610.0,8089.86,No,No,Obtained,Under Review,No,496
Maharashtra,Nashik,Power Plant,58.91,22.01,668,717009762.0,937.44,Yes,Yes,Obtained,Under Review,No,1059
Kerala,Wayanad,Railway Line,244.57,178.73,2922,6247936777.0,4836.75,No,No,Obtained,Pending,Yes,826
West Bengal,Purulia,National Highway,669.03,240.05,9438,19522722665.0,10793.82,Yes,No,Obtained,Not Required,Yes,676
Rajasthan,Jodhpur,Industrial Corridor,738.87,208.59,7496,30799175594.0,45242.54,Yes,No,Obtained,Pending,No,615
Odisha,Dhenkanal,SEZ,645.1,124.68,1653,5636318265.0,7946.27,Yes,No,Obtained,Obtained,No,1224
Sikkim,South Sikkim,Industrial Corridor,163.9,72.71,1154,1647465973.0,1681.09,Yes,Yes,Obtained,Obtained,No,462
Assam,Golaghat,Urban Infrastructure,588.37,16.25,3242,11977363843.0,11328.28,No,No,Obtained,Not Required,Yes,354
Himachal Pradesh,Una,SEZ,431.57,132.56,2419,3874291976.0,3539.42,Yes,No,Pending,Pending,No,1504
Maharashtra,Buldhana,Airport,712.25,427.43,3797,5928142999.0,5836.76,No,No,Obtained,Obtained,Yes,672
Karnataka,Shivamogga (Shimoga),Airport,287.34,84.21,3562,9262270178.0,6934.37,Yes,No,Obtained,Not Required,No,995
Uttar Pradesh,Ambedkar Nagar,National Highway,90.61,48.77,843,924012006.0,506.86,No,No,Under Review,Obtained,Yes,601
Assam,Nagaon,National Highway,480.44,42.5,5548,15731893776.0,5207.85,Yes,Yes,Not Required,Pending,Yes,1946
Tripura,West Tripura,Irrigation/Dam,11.78,6.6,149,534781661.0,419.58,No,No,Pending,Not Required,No,503
Rajasthan,Churu,Urban Infrastructure,709.15,342.15,9160,35170288281.0,20513.05,No,No,Pending,Obtained,No,558
Uttar Pradesh,Sant Kabir Nagar,Urban Infrastructure,109.48,3.71,1347,1117631533.0,796.81,Yes,Yes,Obtained,Not Required,No,1446
Haryana,Fatehabad,Airport,665.87,495.86,8670,31551791379.0,34945.92,Yes,Yes,Obtained,Obtained,No,1019
Gujarat,Valsad,Airport,412.39,295.83,1305,3429178753.0,3485.11,No,No,Not Required,Obtained,No,309
Gujarat,Mehsana,Irrigation/Dam,41.34,4.49,481,177067444.0,170.69,No,No,Pending,Obtained,Yes,795
Madhya Pradesh,Raisen,Mining Project,745.61,363.95,3714,12619769249.0,10497.03,Yes,Yes,Obtained,Obtained,Yes,1392
Odisha,Kendrapara,Irrigation/Dam,503.31,119.22,1015,2978701317.0,2269.34,No,No,Pending,Obtained,No,788
Lakshadweep (UT),Kavaratti,Power Plant,111.77,23.88,1499,3363700806.0,2457.15,Yes,Yes,Obtained,Pending,No,523
Arunachal Pradesh,Upper Subansiri,Mining Project,537.43,294.86,2930,2489588140.0,2675.31,No,No,Under Review,Under Review,Yes,457
Kerala,Idukki,SEZ,86.47,9.13,1004,3948063575.0,4701.73,No,No,Obtained,Not Required,No,353
Maharashtra,Chandrapur,Irrigation/Dam,656.51,475.12,6794,3104591023.0,3942.86,No,No,Not Required,Under Review,Yes,709
Tamil Nadu,Tirunelveli,Railway Line,231.21,39.81,2611,8157343560.0,9439.85,No,No,Obtained,Obtained,No,350
Maharashtra,Solapur,National Highway,585.48,18.28,3368,3566453711.0,4915.47,No,No,Obtained,Not Required,Yes,1042
Assam,Dhubri,Irrigation/Dam,614.68,409.23,6081,20926470736.0,9154.06,No,No,Under Review,Obtained,Yes,745
Assam,Baksa,Mining Project,709.48,240.84,8044,15385835725.0,11994.54,Yes,Yes,Not Required,Not Required,No,1016
Madhya Pradesh,Indore,National Highway,589.67,60.03,2764,3183076428.0,1908.68,No,No,Obtained,Obtained,No,786
Maharashtra,Thane,National Highway,488.35,197.89,2353,7223184362.0,6099.88,No,No,Pending,Obtained,No,390
Jharkhand,Palamu,Mining Project,485.96,354.06,3762,15561203699.0,12271.63,No,No,Pending,Pending,Yes,306
Rajasthan,Udaipur,National Highway,526.66,20.69,3277,11051649444.0,13054.03,No,No,Pending,Obtained,Yes,782
Assam,Kamrup Metropolitan,Power Plant,204.87,144.12,922,739563780.0,697.44,No,No,Obtained,Obtained,No,739
Assam,Cachar,Mining Project,54.5,7.29,384,1356726622.0,1947.28,Yes,No,Pending,Pending,No,923
Tamil Nadu,Ariyalur,State Highway,787.43,198.86,4650,6251202956.0,5083.97,No,No,Pending,Under Review,No,579
Arunachal Pradesh,Lower Subansiri,Irrigation/Dam,478.05,124.21,2417,1942116973.0,2657.49,Yes,Yes,Pending,Pending,No,1283
Assam,Udalguri,Industrial Corridor,657.34,377.13,3865,10687260048.0,16016.81,No,No,Obtained,Pending,Yes,901
Madhya Pradesh,Harda,State Highway,309.23,52.28,1504,4880389196.0,6150.24,No,No,Obtained,Pending,No,344
West Bengal,Murshidabad,Railway Line,545.15,370.61,5819,9115858147.0,11678.1,Yes,Yes,Under Review,Not Required,No,1476
Nagaland,Peren,Airport,7.94,1.86,95,219277631.0,172.07,No,No,Not Required,Obtained,Yes,751
Punjab,Barnala,Port Development,725.9,206.28,1720,6040325402.0,5385.92,No,No,Pending,Pending,No,609
West Bengal,Darjeeling,Power Plant,585.2,265.02,2298,5312582872.0,4755.58,No,No,Not Required,Obtained,No,174
Bihar,Gaya,Industrial Corridor,784.05,20.53,9768,17936540867.0,22399.48,Yes,Yes,Obtained,Not Required,No,1619
Odisha,Koraput,Urban Infrastructure,285.41,167.28,3094,4529648186.0,1703.34,Yes,Yes,Pending,Obtained,No,1673
Rajasthan,Bikaner,Railway Line,258.33,35.09,733,846573787.0,672.96,No,No,Pending,Obtained,No,325
Haryana,Bhiwani,Port Development,399.16,122.41,3174,2758383769.0,849.92,No,No,Not Required,Pending,No,529
Madhya Pradesh,Betul,Airport,474.52,292.38,3326,2514437635.0,1364.88,No,No,Pending,Pending,Yes,472
Himachal Pradesh,Mandi,Power Plant,585.36,303.67,4438,16076752534.0,9603.35,No,No,Obtained,Pending,No,487
Assam,Charaideo,Railway Line,599.27,217.59,5898,7232496320.0,4074.11,No,No,Obtained,Obtained,No,487
Madhya Pradesh,Alirajpur,Irrigation/Dam,304.18,22.57,2650,4722754826.0,6334.46,No,No,Obtained,Pending,No,266
Chhattisgarh,Dantewada (South Bastar),Mining Project,424.58,301.9,2439,3816632607.0,1363.68,No,No,Not Required,Pending,Yes,593
Assam,Karimganj,SEZ,463.73,116.32,1842,6827919559.0,9825.04,Yes,Yes,Pending,Pending,No,1590
Telangana,Komaram Bheem Asifabad,State Highway,266.12,18.31,994,4148441784.0,4275.15,Yes,Yes,Obtained,Pending,No,1375
Maharashtra,Satara,Railway Line,203.82,50.27,2811,10246775640.0,11907.26,Yes,Yes,Obtained,Pending,No,1229
Gujarat,Mahisagar,SEZ,520.73,288.1,3476,13931148255.0,11969.71,No,No,Pending,Not Required,Yes,643
Karnataka,Bengaluru (Bangalore) Rural,Irrigation/Dam,181.69,112.89,2421,5001749168.0,6823.45,No,No,Pending,Pending,Yes,339
Karnataka,Gadag,Power Plant,7.18,1.89,99,376989534.0,415.75,Yes,Yes,Pending,Not Required,Yes,993
Madhya Pradesh,Bhind,SEZ,481.85,47.12,4292,14850359634.0,6115.79,No,No,Under Review,Pending,Yes,1054
Jharkhand,Jamtara,Irrigation/Dam,318.87,37.26,781,2108015632.0,1939.76,No,No,Under Review,Obtained,No,357
Chhattisgarh,Korba,Industrial Corridor,58.45,10.36,395,753655452.0,739.11,No,No,Pending,Under Review,Yes,449
Andhra Pradesh,Guntur,SEZ,443.87,60.58,4456,17463816981.0,17338.47,No,No,Obtained,Obtained,Yes,329
Delhi (NCT),East Delhi,Industrial Corridor,483.96,231.76,1221,565858602.0,654.31,No,No,Pending,Obtained,No,466
Odisha,Puri,Railway Line,37.72,20.62,137,190938301.0,99.55,No,No,Obtained,Obtained,Yes,925
Uttar Pradesh,Varanasi,Urban Infrastructure,388.84,148.14,5592,20252645526.0,10132.85,Yes,No,Obtained,Under Review,Yes,1817
Tamil Nadu,Salem,SEZ,255.27,3.69,1055,588866164.0,713.14,No,No,Pending,Under Review,Yes,1005
Uttar Pradesh,Ghazipur,Irrigation/Dam,738.58,216.52,6200,22575873698.0,15788.69,Yes,Yes,Under Review,Obtained,Yes,1346
Arunachal Pradesh,Namsai,Power Plant,551.05,26.33,6381,7194880867.0,5882.22,No,No,Under Review,Pending,No,397
Mizoram,Saiha,Port Development,548.39,267.58,2969,7505207305.0,6166.89,Yes,No,Obtained,Obtained,No,380
Jharkhand,Giridih,State Highway,530.18,298.0,1721,3356275788.0,3220.67,No,No,Obtained,Obtained,Yes,931
Tamil Nadu,Virudhunagar,State Highway,435.09,14.59,5904,20019482381.0,21522.94,No,No,Pending,Pending,No,631
Himachal Pradesh,Kinnaur,State Highway,110.5,68.4,1197,405789200.0,460.46,No,No,Under Review,Pending,Yes,466
Karnataka,Hassan,Port Development,214.98,163.37,2702,10730695473.0,14193.47,No,No,Pending,Pending,Yes,101
Lakshadweep (UT),Agatti,Airport,241.95,21.88,3520,13875782567.0,14951.55,No,No,Obtained,Not Required,Yes,318
Rajasthan,Bhilwara,SEZ,428.51,132.18,5141,10907365822.0,10682.02,No,No,Pending,Pending,Yes,605
Jammu and Kashmir,Kupwara,Irrigation/Dam,771.88,489.29,4637,6552235380.0,2908.51,Yes,Yes,Not Required,Not Required,Yes,867
Rajasthan,Kota,Power Plant,598.42,295.82,4552,5315575251.0,2969.71,No,No,Pending,Obtained,Yes,251
Assam,Sivasagar,Urban Infrastructure,97.16,17.68,1286,4841396810.0,1459.11,No,No,Obtained,Obtained,No,765
Karnataka,Ballari (Bellary),Power Plant,326.66,68.8,3129,14011554570.0,17923.83,Yes,No,Pending,Pending,No,1724
Chhattisgarh,Kabirdham (Kawardha),State Highway,555.19,280.99,6864,9748437595.0,3890.93,No,No,Obtained,Under Review,Yes,530
Punjab,Jalandhar,Railway Line,604.87,105.31,8444,9817712001.0,13562.28,Yes,Yes,Obtained,Not Required,No,1455
Uttar Pradesh,Baghpat,SEZ,165.6,82.7,1713,2226675025.0,2606.03,No,No,Obtained,Not Required,Yes,468
Jammu and Kashmir,Ganderbal,Industrial Corridor,147.58,23.1,2178,9380936788.0,3590.19,No,No,Obtained,Not Required,Yes,753
Nagaland,Tuensang,Railway Line,520.0,342.53,1305,2497101104.0,1321.48,No,No,Not Required,Pending,Yes,587
Delhi (NCT),Central Delhi,Irrigation/Dam,312.15,137.26,2855,10752808014.0,11267.76,No,No,Obtained,Obtained,Yes,619
Madhya Pradesh,Panna,Port Development,320.65,232.01,4546,10398431053.0,3791.17,No,No,Pending,Under Review,Yes,518
Rajasthan,Dausa,State Highway,708.23,431.69,2542,9375115709.0,6517.05,No,No,Obtained,Not Required,Yes,512
Madhya Pradesh,Dewas,National Highway,526.66,300.63,7650,4141287301.0,5086.87,Yes,Yes,Obtained,Not Required,No,1232
Telangana,Suryapet,Industrial Corridor,416.56,114.08,1616,2095995459.0,2689.21,No,No,Obtained,Obtained,No,412
Karnataka,Dakshina Kannada,SEZ,477.17,363.43,1624,6190207361.0,2215.36,Yes,Yes,Obtained,Obtained,No,576
Arunachal Pradesh,Kurung Kumey,Irrigation/Dam,328.1,136.13,4344,17768089593.0,8840.77,Yes,Yes,Under Review,Not Required,Yes,2003
Andhra Pradesh,Vizianagaram,Irrigation/Dam,126.51,24.04,1140,4070063580.0,3811.31,Yes,Yes,Obtained,Under Review,No,718
Meghalaya,South West Garo Hills ,Industrial Corridor,192.02,45.74,1368,2238232270.0,1699.6,No,No,Pending,Not Required,No,434
Lakshadweep (UT),Kalpeni,Industrial Corridor,437.06,0.44,3556,12644525801.0,9344.08,Yes,No,Pending,Obtained,No,1270
Kerala,Kozhikode,Port Development,707.3,190.5,4458,6834168834.0,9843.73,No,No,Obtained,Pending,No,392
Haryana,Charkhi Dadri,Industrial Corridor,779.51,538.72,4808,20571371640.0,11129.56,Yes,No,Under Review,Obtained,No,1275
Nagaland,Longleng,State Highway,555.32,147.68,6670,9210027383.0,11391.68,Yes,Yes,Obtained,Under Review,Yes,949
Tamil Nadu,Tiruvannamalai,State Highway,107.86,25.5,1426,1134873918.0,630.05,No,No,Pending,Under Review,Yes,534
Tripura,Sepahijala,Urban Infrastructure,207.35,151.82,2440,3755652075.0,3464.91,Yes,Yes,Pending,Obtained,No,1176
Andhra Pradesh,Kurnool,Irrigation/Dam,219.61,13.11,2403,2937388105.0,2024.27,No,No,Obtained,Not Required,No,305
Arunachal Pradesh,Upper Siang,National Highway,443.59,203.1,942,580294808.0,789.04,No,No,Pending,Not Required,No,249
West Bengal,Kalimpong,Irrigation/Dam,437.1,256.16,3963,1541897096.0,544.95,No,No,Obtained,Not Required,No,69
Jharkhand,Ranchi,Industrial Corridor,222.81,31.46,1908,5664320046.0,2541.28,Yes,Yes,Pending,Obtained,No,1520
Arunachal Pradesh,East Siang,Port Development,654.6,366.9,6954,29509340839.0,13608.21,Yes,Yes,Pending,Obtained,No,1105
Uttar Pradesh,Lakhimpur - Kheri,Power Plant,394.9,217.06,5465,24518985258.0,25190.97,No,No,Pending,Not Required,Yes,282
Bihar,Patna,Railway Line,9.85,1.03,92,182463071.0,85.8,No,No,Obtained,Not Required,Yes,852
Tamil Nadu,Karur,Port Development,398.36,19.45,2592,8371021204.0,2720.32,Yes,Yes,Obtained,Obtained,Yes,2057"""

parsed_rows = []
for l in raw_data_lines.strip().splitlines():
    p = l.strip().split(",")
    if len(p) == 14:
        parsed_rows.append(p)

# Base DataFrame from provided records
df_base = pd.DataFrame(parsed_rows, columns=cols)
for num_c in ["Land_Required_Hectare", "Land_Remaining_Hectare", "Affected_Families", "Compensation_Amount", "Project_Cost", "Overall_Delay"]:
    df_base[num_c] = pd.to_numeric(df_base[num_c], errors="coerce")

print("Base records parsed:", len(df_base))

# Generate remaining records up to exactly 1757 rows with realistic distributions
target_count = 1757
needed = target_count - len(df_base)
np.random.seed(42)

states = df_base["State"].unique()
districts_by_state = df_base.groupby("State")["District"].unique().to_dict()
project_types = df_base["Project_Type"].unique()
clearance_opts = ["Obtained", "Pending", "Under Review", "Not Required"]
yes_no = ["Yes", "No"]

new_rows = []
for i in range(needed):
    # Sample a state and its district
    st = np.random.choice(states)
    dists = districts_by_state.get(st, ["District_A"])
    dst = np.random.choice(dists)
    pt = np.random.choice(project_types)
    
    land_req = round(float(np.random.uniform(15.0, 795.0)), 2)
    rem_pct = np.random.uniform(0.05, 0.75)
    land_rem = round(land_req * rem_pct, 2)
    
    aff_fam = int(np.random.randint(50, 11500))
    cost = round(float(np.random.uniform(100.0, 38000.0)), 2)
    comp_amt = round(float(cost * 1e7 * np.random.uniform(0.6, 1.4)), 1)
    
    legal = np.random.choice(["No", "Yes"], p=[0.65, 0.35])
    court = legal if np.random.rand() > 0.2 else ("Yes" if legal == "No" and np.random.rand() < 0.1 else "No")
    env_clear = np.random.choice(clearance_opts, p=[0.45, 0.25, 0.20, 0.10])
    for_clear = np.random.choice(clearance_opts, p=[0.40, 0.30, 0.18, 0.12])
    rehab = np.random.choice(yes_no, p=[0.6, 0.4])
    
    # Realistic delay synthesis based on risk factors (matches rules engine)
    base_delay = 180 + np.random.randint(20, 150)
    if legal == "Yes": base_delay += np.random.randint(400, 950)
    if court == "Yes": base_delay += np.random.randint(250, 600)
    if env_clear == "Pending": base_delay += np.random.randint(200, 500)
    if for_clear == "Pending": base_delay += np.random.randint(250, 650)
    if rehab == "Yes": base_delay += np.random.randint(150, 450)
    if land_rem / land_req > 0.5: base_delay += np.random.randint(100, 300)
    
    overall_delay = int(max(60, min(2200, base_delay + np.random.randint(-40, 60))))
    
    new_rows.append([
        st, dst, pt, land_req, land_rem, aff_fam, comp_amt, cost,
        legal, court, env_clear, for_clear, rehab, overall_delay
    ])

df_synth = pd.DataFrame(new_rows, columns=cols)
df_final = pd.concat([df_base, df_synth], ignore_index=True)

print("Final dataset shape:", df_final.shape)

out_file = r"D:\landvision 3.0\ml_service\data\landvision_ml_train_1757.csv"
seed_file = r"D:\landvision 3.0\ml_service\seed_data.csv"
os.makedirs(os.path.dirname(out_file), exist_ok=True)

df_final.to_csv(out_file, index=False)
df_final.to_csv(seed_file, index=False)

print(f"Successfully saved {len(df_final)} rows and {len(cols)} columns to:")
print(f" - {out_file}")
print(f" - {seed_file}")
