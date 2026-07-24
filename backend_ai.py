import sys
import json
import urllib.request
import urllib.error

def main():
    try:
        # Read the input payload from standard input
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input provided to Python AI engine."}))
            return

        try:
            payload = json.loads(input_data)
        except json.JSONDecodeError:
            print(json.dumps({"error": "Failed to parse input parameters as valid JSON."}))
            return
        api_key = payload.get("api_key")
        message = payload.get("message")
        history = payload.get("history", [])
        system_prompt = payload.get("system_prompt", "")
        model_name = payload.get("model", "gemini-2.5-flash")

        if not api_key:
            print(json.dumps({"error": "Gemini API key is required."}))
            return

        # Prepare chat history for Gemini REST API
        # Gemini expects roles to be "user" or "model"
        contents = []
        for item in history:
            role = item.get("role")
            if role == "assistant" or role == "model":
                role_val = "model"
            else:
                role_val = "user"
            contents.append({
                "role": role_val,
                "parts": [{"text": item.get("text", "")}]
            })

        # Append the current message
        contents.append({
            "role": "user",
            "parts": [{"text": message}]
        })

        # Prepare request payload
        req_payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7
            }
        }

        if system_prompt:
            req_payload["systemInstruction"] = {
                "parts": [{"text": system_prompt}]
            }

        # Call the Gemini REST API
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "python-urllib-aistudio"
        }

        data_bytes = json.dumps(req_payload).encode("utf-8")
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req) as response:
                res_bytes = response.read()
                res_json = json.loads(res_bytes.decode("utf-8"))
                
                # Extract text response from Gemini structure
                # response -> candidates[0] -> content -> parts[0] -> text
                candidates = res_json.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        output_text = parts[0].get("text", "")
                        print(json.dumps({"response": output_text}))
                        return
                
                print(json.dumps({"error": "No text returned from Gemini API.", "details": res_json}))
        except urllib.error.HTTPError as he:
            err_content = he.read().decode("utf-8")
            try:
                err_json = json.loads(err_content)
                print(json.dumps({"error": f"API HTTP Error {he.code}", "details": err_json}))
            except Exception:
                print(json.dumps({"error": f"API HTTP Error {he.code}", "details": err_content}))
        except Exception as e:
            print(json.dumps({"error": f"Connection error: {str(e)}"}))

    except Exception as e:
        print(json.dumps({"error": f"Python script runtime error: {str(e)}"}))

if __name__ == "__main__":
    main()
