"""
Pre-analyzed CV responses for demo scenarios.
Simulates what Gemini Vision would return for specific lettuce issues.
"""

DEMO_CV_CACHE = {
    "bacterial_leaf_spot": {
        "crop_type": "lettuce",
        "overall_health": "diseased",
        "growth_stage": "vegetative",
        "image_url": "/lettuce_demo_images/lettuce-leaf-rust.jpg",
        "nutrient_deficiencies": {
            "nitrogen": {"detected": False, "confidence": 0.88, "severity_score": 0.12},
            "phosphorus": {"detected": False, "confidence": 0.91, "severity_score": 0.08},
            "potassium": {"detected": True, "confidence": 0.76, "severity_score": 0.52}
        },
        "diseases_detected": [
            {
                "name": "Bacterial Leaf Spot (Xanthomonas)",
                "confidence": 0.91,
                "severity": "moderate"
            }
        ],
        "visual_symptoms": [
            "Small water-soaked lesions on leaves",
            "Brown spots with yellow halos",
            "Irregular lesion patterns"
        ],
        "recommendations": [
            "Remove infected leaves immediately",
            "Reduce humidity below 80%",
            "Apply copper-based bactericide",
            "Improve air circulation",
            "Avoid overhead watering"
        ]
    },
    "fungal_infection": {
        "crop_type": "lettuce",
        "overall_health": "diseased",
        "growth_stage": "mature",
        "image_url": "/demo-images/lettuce-fungal.jpg",
        "nutrient_deficiencies": {
            "nitrogen": {"detected": True, "confidence": 0.82, "severity_score": 0.58},
            "phosphorus": {"detected": False, "confidence": 0.87, "severity_score": 0.22},
            "potassium": {"detected": False, "confidence": 0.89, "severity_score": 0.18}
        },
        "diseases_detected": [
            {
                "name": "Fungal Infection (likely Downy/Powdery Mildew)",
                "confidence": 0.88,
                "severity": "moderate"
            }
        ],
        "visual_symptoms": [
            "White/gray fungal growth on leaves",
            "Yellowing beneath infected areas",
            "Leaf distortion"
        ],
        "recommendations": [
            "Apply fungicide (copper or sulfur-based)",
            "Increase nitrogen dosing by 20%",
            "Reduce humidity",
            "Improve ventilation"
        ]
    },
    "healthy": {
        "crop_type": "lettuce",
        "overall_health": "healthy",
        "growth_stage": "vegetative",
        "image_url": "/demo-images/lettuce-healthy.jpg",
        "nutrient_deficiencies": {
            "nitrogen": {"detected": False, "confidence": 0.95, "severity_score": 0.05},
            "phosphorus": {"detected": False, "confidence": 0.93, "severity_score": 0.08},
            "potassium": {"detected": False, "confidence": 0.91, "severity_score": 0.10}
        },
        "diseases_detected": [],
        "visual_symptoms": [],
        "recommendations": ["Continue current care regimen"]
    }
}