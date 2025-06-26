import requests

response = requests.post(
    "http://localhost:5000/api/chat",
    json={"question": "How can I develop more patience in my spiritual journey?"}
)
print(response.json())
