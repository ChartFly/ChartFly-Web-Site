from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Tell FastAPI to serve the files in the 'static' folder
app.mount("/", StaticFiles(directory="static", html=True), name="static")

from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="static", html=True), name="static")

