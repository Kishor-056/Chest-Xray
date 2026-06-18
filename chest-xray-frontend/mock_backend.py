import uvicorn
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import datetime
import base64

app = FastAPI(title="Mock Chest X-Ray AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLASS_NAMES = ['COVID-19', 'Normal', 'Pneumonia', 'Tuberculosis']
MODEL_LIST = ['DenseNet169', 'EfficientNet-B5', 'ViT-Base', 'ViT-Base-Enhanced', 'Enhanced-Hybrid']

# Tiny 1x1 gray pixel PNG base64 for GradCAM mock
MOCK_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
MOCK_IMAGE_DATA = f"data:image/png;base64,{MOCK_PNG_BASE64}"

import hashlib
import uuid
import json
import os

prediction_hashes = {}
feedback_memory = {}
feedback_data = []
FEEDBACK_MEMORY_FILE = "./chest/cache/feedback_memory.json"

def load_feedback_memory():
    global feedback_memory
    try:
        if os.path.exists(FEEDBACK_MEMORY_FILE):
            with open(FEEDBACK_MEMORY_FILE, 'r') as f:
                feedback_memory = json.load(f)
            print(f"Loaded {len(feedback_memory)} feedback overrides.")
    except Exception as e:
        print(f"Error loading feedback memory: {e}")

def save_feedback_memory():
    try:
        os.makedirs(os.path.dirname(FEEDBACK_MEMORY_FILE), exist_ok=True)
        with open(FEEDBACK_MEMORY_FILE, 'w') as f:
            json.dump(feedback_memory, f)
    except Exception as e:
        print(f"Error saving feedback memory: {e}")

load_feedback_memory()

def check_prediction_override(image_bytes, filename=None):
    img_hash = hashlib.md5(image_bytes).hexdigest()
    if img_hash in feedback_memory:
        label = feedback_memory[img_hash]
        print(f"Applying feedback memory override: {label} for hash {img_hash}")
        all_probs = {
            'COVID-19': 0.02,
            'Normal': 0.02,
            'Pneumonia': 0.02,
            'Tuberculosis': 0.02
        }
        if label in all_probs:
            all_probs[label] = 0.94
            total = sum(all_probs.values())
            all_probs = {k: v / total for k, v in all_probs.items()}
        return {
            "prediction": label,
            "confidence": 0.94,
            "all_probabilities": all_probs,
            "explanation": f"Overridden by user feedback diagnosis: {label}."
        }, img_hash

    if filename:
        name_lower = filename.lower()
        target_label = None
        if "pneumonia" in name_lower:
            target_label = "Pneumonia"
        elif "tuberculosis" in name_lower or "tb" in name_lower:
            target_label = "Tuberculosis"
        elif "covid" in name_lower:
            target_label = "COVID-19"
        elif "normal" in name_lower or "clear" in name_lower:
            target_label = "Normal"

        if target_label:
            print(f"Applying filename override: {target_label} for file {filename}")
            all_probs = {
                'COVID-19': 0.02,
                'Normal': 0.02,
                'Pneumonia': 0.02,
                'Tuberculosis': 0.02
            }
            all_probs[target_label] = 0.94
            total = sum(all_probs.values())
            all_probs = {k: v / total for k, v in all_probs.items()}
            return {
                "prediction": target_label,
                "confidence": 0.94,
                "all_probabilities": all_probs,
                "explanation": f"Detected filename keyword: predicting {target_label}."
            }, img_hash

    return None, img_hash

# 1. Health check
@app.get("/")
def read_root():
    return {"status": "healthy", "message": "Mock Backend API Running"}

@app.get("/health/detailed")
def detailed_health_check():
    return {
        "status": "healthy",
        "models": MODEL_LIST,
        "device": "cpu",
        "cuda_available": False
    }

# 3. List models
@app.get("/models")
async def get_models():
    return {
        "models": MODEL_LIST,
        "total": len(MODEL_LIST),
        "ensemble_available": True
    }

# 4. Model info
@app.get("/model/info")
async def model_info_alt():
    return {"models": MODEL_LIST, "classes": CLASS_NAMES}

@app.get("/info/{model_name}")
async def model_info(model_name: str):
    return {
        "name": model_name,
        "classes": CLASS_NAMES,
        "status": "loaded"
    }

# 5. Upload image
@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    return {"success": True, "filename": file.filename}

# Helper to generate mock probabilities
def get_mock_probs(prediction="Normal"):
    probs = {}
    if prediction == "Normal":
        probs = {'COVID-19': 0.1, 'Normal': 0.7, 'Pneumonia': 0.15, 'Tuberculosis': 0.05}
    elif prediction == "Pneumonia":
        probs = {'COVID-19': 0.05, 'Normal': 0.1, 'Pneumonia': 0.8, 'Tuberculosis': 0.05}
    else:
        probs = {'COVID-19': 0.25, 'Normal': 0.25, 'Pneumonia': 0.25, 'Tuberculosis': 0.25}
    return probs

# 6. Predict
@app.post("/predict")
async def predict(file: UploadFile = File(...), model_name: str = Form("DenseNet169")):
    try:
        file_bytes = await file.read()
        override, img_hash = check_prediction_override(file_bytes, file.filename)
        prediction_id = f"pred_{uuid.uuid4().hex[:10]}"
        prediction_hashes[prediction_id] = img_hash

        if override:
            result = {
                "success": True,
                "prediction": override["prediction"],
                "confidence": override["confidence"],
                "all_probabilities": override["all_probabilities"],
                "model_used": model_name,
                "prediction_id": prediction_id,
                "timestamp": datetime.datetime.now().isoformat()
            }
        else:
            result = {
                "success": True,
                "prediction": "Normal",
                "confidence": 0.70,
                "all_probabilities": get_mock_probs("Normal"),
                "model_used": model_name,
                "prediction_id": prediction_id,
                "timestamp": datetime.datetime.now().isoformat()
            }
        return result
    except Exception as e:
        raise HTTPException(500, str(e))

# 7. Realtime predict
@app.post("/predict/realtime")
async def realtime(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        override, _ = check_prediction_override(file_bytes, file.filename)
        if override:
            return {"prediction": override['prediction'], "confidence": override['confidence']}
        return {"prediction": "Normal", "confidence": 0.70}
    except Exception as e:
        raise HTTPException(500, str(e))

# 8. RAG Analyze
@app.post("/analyze")
async def analyze(file: UploadFile = File(...), query: str = Form("Explain")):
    try:
        file_bytes = await file.read()
        override, img_hash = check_prediction_override(file_bytes, file.filename)
        prediction_id = f"pred_{uuid.uuid4().hex[:10]}"
        prediction_hashes[prediction_id] = img_hash

        if override:
            result = {
                "prediction": override["prediction"],
                "confidence": override["confidence"],
                "all_probabilities": override["all_probabilities"],
                "model_used": "Ensemble",
                "prediction_id": prediction_id
            }
        else:
            result = {
                "prediction": "Normal",
                "confidence": 0.70,
                "all_probabilities": get_mock_probs("Normal"),
                "model_used": "Ensemble",
                "prediction_id": prediction_id
            }
        return {
            **result,
            "rag_context": "Normal X-rays have clear lung fields."
        }
    except Exception as e:
        raise HTTPException(500, str(e))

# 9. Explain
@app.post("/explain")
async def explain(file: UploadFile = File(...), model_name: str = Form("DenseNet169")):
    try:
        file_bytes = await file.read()
        override, img_hash = check_prediction_override(file_bytes, file.filename)
        prediction_id = f"pred_{uuid.uuid4().hex[:10]}"
        prediction_hashes[prediction_id] = img_hash

        if override:
            result = {
                "prediction": override["prediction"],
                "confidence": override["confidence"],
                "all_probabilities": override["all_probabilities"],
                "model_used": model_name,
                "prediction_id": prediction_id,
                "gradcam": MOCK_IMAGE_DATA,
                "explanation": override["explanation"]
            }
        else:
            result = {
                "prediction": "Normal",
                "confidence": 0.70,
                "all_probabilities": get_mock_probs("Normal"),
                "model_used": model_name,
                "prediction_id": prediction_id,
                "gradcam": MOCK_IMAGE_DATA,
                "explanation": "Predicted Normal. Clear lung fields observed."
            }
        return result
    except Exception as e:
        raise HTTPException(500, str(e))

# 10. Compare
@app.post("/compare")
async def compare(file: UploadFile = File(...)):
    individual = {}
    for model in MODEL_LIST:
        individual[model] = {
            "prediction": "Normal",
            "confidence": 0.70,
            "all_probabilities": get_mock_probs("Normal"),
            "model_used": model
        }
    return {
        "individual_results": individual,
        "agreement": {
            "consensus": True,
            "agreement_rate": 1.0,
            "most_common": "Normal"
        },
        "processing_time": 0.25,
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.post("/compare_models")
async def compare_alt(file: UploadFile = File(...)):
    return await compare(file)

# 11. GradCAM
@app.post("/gradcam")
async def gradcam(file: UploadFile = File(...), model_name: str = Form("DenseNet169")):
    return {
        "prediction": "Normal",
        "confidence": 0.70,
        "model_used": model_name,
        "gradcam": MOCK_PNG_BASE64,
        "heatmap_base64": MOCK_PNG_BASE64
    }

@app.post("/gradcam/enhanced")
async def gradcam_enhanced(file: UploadFile = File(...), model_name: str = Form("DenseNet169")):
    return {
        "prediction": "Normal",
        "confidence": 0.70,
        "model_used": model_name,
        "overlay": MOCK_PNG_BASE64
    }

@app.post("/gradcam/heatmap")
async def gradcam_heatmap(file: UploadFile = File(...), model_name: str = Form("DenseNet169")):
    return {
        "prediction": "Normal",
        "confidence": 0.70,
        "model_used": model_name,
        "heatmap": MOCK_PNG_BASE64
    }

# 12. Report
@app.post("/report")
async def report(file: UploadFile = File(...), patient_id: str = Form("P001")):
    return {
        "patient_id": patient_id,
        "prediction": "Normal",
        "confidence": 0.70,
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.post("/clinical_report")
async def clinical_report(file: UploadFile = File(...), patient_id: str = Form("P001")):
    return {
        "patient_id": patient_id,
        "prediction": "Normal",
        "confidence": 0.70,
        "clinical_notes": ["Lung fields are clear.", "No pleural effusion seen."],
        "recommended_actions": ["Routine follow-up in 12 months."],
        "findings": "The chest radiograph shows clear lung fields without focal consolidation, effusion, or pneumothorax.",
        "probabilities": get_mock_probs("Normal"),
        "model_used": "Ensemble",
        "timestamp": datetime.datetime.now().isoformat()
    }

# 13. Batch Processing
@app.post("/predict/batch")
async def batch_predict(files: List[UploadFile] = File(...), model_name: str = Form("DenseNet169")):
    results = []
    for file in files:
        results.append({
            "filename": file.filename,
            "prediction": "Normal",
            "confidence": 0.70,
            "all_probabilities": get_mock_probs("Normal"),
            "model_used": model_name
        })
    return {
        "success": True,
        "results": results,
        "statistics": {
            "total": len(files),
            "success_rate": 1.0,
            "avg_confidence": 0.70,
            "disease_distribution": {"Normal": len(files)}
        },
        "processing_time": 0.15,
        "total_processed": len(files)
    }

@app.post("/predict/batch/advanced")
async def batch_advanced(files: List[UploadFile] = File(...)):
    return await batch_predict(files, "ensemble")

@app.post("/batch_predict")
async def batch_predict_alt(files: List[UploadFile] = File(...)):
    return await batch_predict(files)

# 14. Feedback
@app.post("/feedback")
async def feedback(prediction_id: str = Form(...), correct_label: str = Form(...)):
    try:
        if prediction_id in prediction_hashes:
            img_hash = prediction_hashes[prediction_id]
            feedback_memory[img_hash] = correct_label
            save_feedback_memory()
            print(f"Feedback learning (mock): mapped hash {img_hash} -> {correct_label}")
        feedback_data.append({"id": prediction_id, "label": correct_label, "time": datetime.datetime.now().isoformat()})
        return {"success": True, "total_feedback": len(feedback_data)}
    except Exception as e:
        raise HTTPException(500, f"Failed to save feedback: {str(e)}")

# 15. Switch model
@app.post("/model/switch")
async def switch_model(model_name: str = Form(...)):
    return {"success": True, "current_model": model_name}

# 16. Metrics
@app.get("/metrics")
async def metrics():
    return {
        "total_predictions": 10,
        "models_loaded": len(MODEL_LIST),
        "device": "cpu"
    }

# 17. Analytics
@app.get("/analytics")
async def analytics():
    return {
        "total_predictions": 10,
        "predictions_by_class": {"Normal": 8, "Pneumonia": 2}
    }

# 18. Patient history
@app.get("/history/{patient_id}")
async def history(patient_id: str):
    return {"patient_id": patient_id, "history": []}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
