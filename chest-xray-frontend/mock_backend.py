from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "Mock Backend API Running"}

@app.get("/health")
def health_check():
    return {"status": "online", "models_loaded": 5, "device": "cpu"}

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    model_name: str = Form("DenseNet-169")
):
    # Simulate processing time
    time.sleep(1)
    
    # Check if the file is an image
    content_type = file.content_type
    if not content_type.startswith("image/"):
        return JSONResponse(status_code=400, content={"detail": "Invalid file format. Please upload an image."})
    
    return {
        "success": True,
        "prediction": "Pneumonia",
        "confidence": 98.5,
        "model_used": model_name,
        "inference_time": "0.1s"
    }

@app.post("/batch-predict")
async def batch_predict(files: list[UploadFile] = File(...)):
    time.sleep(1)
    results = []
    for f in files:
        results.append({
            "filename": f.filename,
            "prediction": "Normal",
            "confidence": 95.0
        })
    return {
        "success": True,
        "batch_id": "BATCH_123",
        "results": results,
        "summary": {"Normal": len(files), "Pneumonia": 0}
    }

@app.post("/compare-models")
async def compare_models(file: UploadFile = File(...)):
    time.sleep(1)
    return {
        "success": True,
        "best_model": "DenseNet-169",
        "results": [
            {"model": "DenseNet-169", "prediction": "Pneumonia", "confidence": 98.5},
            {"model": "EfficientNet-B5", "prediction": "Pneumonia", "confidence": 97.2},
            {"model": "ResNet-50", "prediction": "Normal", "confidence": 55.1}
        ]
    }

@app.post("/generate-gradcam")
async def generate_gradcam(file: UploadFile = File(...)):
    time.sleep(1)
    return {
        "success": True,
        "heatmap_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", # 1x1 transparent pixel
        "overlay_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    }

@app.post("/generate-report")
async def generate_report(
    patient_id: str = Form(...),
    file: UploadFile = File(...)
):
    time.sleep(1)
    return {
        "success": True,
        "report_id": "REP_999",
        "patient_id": patient_id,
        "diagnosis": "Pneumonia",
        "confidence": 98.5,
        "pdf_url": "#"
    }

@app.post("/submit-feedback")
async def submit_feedback(
    prediction_id: str = Form(...),
    actual_diagnosis: str = Form(...),
    comments: str = Form(...)
):
    return {
        "success": True,
        "message": "Feedback received successfully"
    }

if __name__ == "__main__":
    print("Starting Mock Backend on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
