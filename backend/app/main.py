from fastapi import FastAPI

app = FastAPI(
    title="CampusIQ API",
    version="1.0.0",
)

@app.get("/")
def root():
    return {
        "message": "CampusIQ Backend Running"
    }
@app.get("/health")
def health():
    return {
        "status": "healthy"
    }