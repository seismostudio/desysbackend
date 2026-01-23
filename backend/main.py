from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import uvicorn

from solver.fea_solver import analyze_structure, combine_results
from models import StructuralModel, LoadCombination, AnalysisResults, SolverConfig

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    model: StructuralModel
    loadCaseId: str
    config: Optional[SolverConfig] = None

class CombineRequest(BaseModel):
    combination: LoadCombination
    resultsMap: Dict[str, AnalysisResults]

@app.get("/")
def read_root():
    return {"status": "ok", "service": "FEA Solver"}

@app.post("/analyze", response_model=AnalysisResults)
def run_analysis(request: AnalyzeRequest):
    try:
        results = analyze_structure(request.model, request.loadCaseId, request.config)
        if not results.isValid:
            raise HTTPException(status_code=400, detail="Analysis failed: " + "; ".join(results.log))
        return results
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/combine", response_model=AnalysisResults)
def run_combination(request: CombineRequest):
    try:
        results = combine_results(request.combination, request.resultsMap)
        if not results.isValid:
            raise HTTPException(status_code=400, detail="Combination failed: " + "; ".join(results.log))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
