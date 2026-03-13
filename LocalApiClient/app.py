import os
import json
import logging
import threading
import time
import webbrowser
from flask import Flask, render_template, request, jsonify
import requests
import pystray
from PIL import Image, ImageDraw
import sys

app = Flask(__name__)
DATA_FILE = os.path.join(os.path.dirname(__file__), 'data.json')

# Determine port from arguments, env variables, or default
def get_port():
    port = os.environ.get('LOCAL_API_PORT', 5000)
    for index, arg in enumerate(sys.argv):
        if arg == '--port' and index + 1 < len(sys.argv):
            port = sys.argv[index + 1]
    return int(port)

PORT = get_port()

# Configure basic logging
logging.basicConfig(level=logging.DEBUG)

def load_data():
    """Load collections from the local data.json file."""
    if not os.path.exists(DATA_FILE):
        return {"collections": []}
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        app.logger.error(f"Error loading data: {e}")
        return {"collections": []}

def save_data(data):
    """Save collections back to the local data.json file."""
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=4)
        return True
    except Exception as e:
        app.logger.error(f"Error saving data: {e}")
        return False

@app.route('/')
def index():
    """Serve the main UI."""
    return render_template('index.html')

@app.route('/api/execute', methods=['POST'])
def execute_request():
    """Execute the HTTP request defined by the client."""
    req_data = request.json
    if not req_data:
        return jsonify({"error": "No data provided"}), 400

    url = req_data.get('url')
    method = req_data.get('method', 'GET').upper()
    headers = req_data.get('headers', {})
    body = req_data.get('body')

    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        # We pass verify=False for local testing if needed, but standard requests should have it True.
        # We also pass a timeout to avoid hanging requests indefinitely.
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            json=body if (isinstance(body, dict) or isinstance(body, list)) else None,
            data=body if isinstance(body, str) else None,
            timeout=30
        )
        
        # Prepare response to send back to client
        resp_data = {
            "status": response.status_code,
            "status_text": response.reason,
            "headers": dict(response.headers),
            "time_ms": int(response.elapsed.total_seconds() * 1000),
            "size_bytes": len(response.content) if response.content else 0
        }

        # Attempt to parse json body, fallback to text
        try:
            resp_data["body"] = response.json()
            resp_data["is_json"] = True
            resp_data["is_xml"] = False
        except ValueError:
            text = response.text
            resp_data["body"] = text
            resp_data["is_json"] = False
            if text.strip().startswith('<') and text.strip().endswith('>'):
                resp_data["is_xml"] = True
            else:
                resp_data["is_xml"] = False

        return jsonify(resp_data)

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Request execution failed: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/collections', methods=['GET'])
def get_collections():
    """Get all saved request flows."""
    return jsonify(load_data())

@app.route('/api/collections', methods=['POST'])
def save_collections():
    """Overwrite saved request flows."""
    data = request.json
    if save_data(data):
        return jsonify({"message": "Data saved successfully"})
    return jsonify({"error": "Failed to save data"}), 500

def run_server():
    # Disable flask output so it doesn't spam the console when run in background
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)
    app.run(port=PORT, use_reloader=False)

def create_image():
    # Generate a simple 64x64 blue icon with a white 'A' in the center for the tray
    image = Image.new('RGB', (64, 64), color=(59, 130, 246))
    draw = ImageDraw.Draw(image)
    draw.rectangle([16, 16, 48, 48], fill=(255, 255, 255))
    return image

def on_open(icon, item):
    webbrowser.open(f"http://127.0.0.1:{PORT}")

def on_exit(icon, item):
    icon.stop()
    # Hard exit the process to instantly kill the flask thread
    os._exit(0)

if __name__ == '__main__':
    # Initialize empty data.json if missing
    if not os.path.exists(DATA_FILE):
        save_data({"collections": []})
        
    # Start flask server on a daemon thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Initial auto-launch
    time.sleep(1) # Give flask a split second to bind to port
    webbrowser.open(f"http://127.0.0.1:{PORT}")

    # Start system tray
    icon = pystray.Icon("LocalApiClient")
    icon.menu = pystray.Menu(
        pystray.MenuItem("Open Client", on_open, default=True),
        pystray.MenuItem("Exit", on_exit)
    )
    icon.icon = create_image()
    icon.title = "Local API Client"
    
    # This loop blocks until the user clicks Exit
    icon.run()
