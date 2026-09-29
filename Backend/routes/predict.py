from fastapi import APIRouter
from schemas.ride_input import RideInput
from services.predictor import predict_surge
from services.enrichment import enrich_input

router = APIRouter()

@router.post("/predict")
def predict(data: RideInput):
    enriched_data = enrich_input(data)

    surge = predict_surge(enriched_data)

    return {
        "surge_multiplier": round(surge, 2),
        "processed_data": enriched_data
    }