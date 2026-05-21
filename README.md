# AuraFarm 🌿
### Next-Gen Smart Agrotech & Web3 Agri-Finance Network

[![Hackathon](https://img.shields.io/badge/Hackathon-UTMxHackathon-green.svg)](https://github.com/JY156/UTMxHackathon_AuraFarm)
[![Team](https://img.shields.io/badge/Team-Meow3Wang-blue.svg)](https://github.com/JY156/UTMxHackathon_AuraFarm)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> "AuraFarm is a next-generation smart agrotech and Web3 agri-finance platform designed to help urban farms optimize crop yields, eliminate market price volatility, and unlock operational capital through on-chain escrow tokens and AI-driven automation."

---

## ⚠️ The Problem: Traditional Urban Farming Bottlenecks

Urban farms suffer from severe systemic vulnerabilities that hinder scalability and profitability:

1. **Limited Financial Accessibility**
   * **Finance Gaps:** Fragmented financial profiles make traditional underwriting impossible.
   * **Unscalable Growth:** Inefficient resource allocation due to lack of visibility.
   * **Credit Access:** Unproven creditworthiness blocks loans for modern equipment.
   * **Low Efficiency:** Incomplete data tracking leads to a lack of operational integrity.
2. **Unstable Market Demand & Price Volatility**
   * Mismatched farming cycles and high wholesale price volatility lead to massive crop waste and unpredictable revenue.
3. **Manual Monitoring & Resource Waste**
   * **Data Gaps:** Inconsistent and disjointed manual data collection.
   * **Resource Waste:** Excess water loss/leaks and high electricity overhead.
   * **Poor Planning:** Suboptimal crop cycles leading to preventable crop loss.

---

## 💡 Our Solution: De-Risked Urban Agriculture Infrastructure

AuraFarm connects the physical farm, intelligent AI analytics, and decentralized finance to deliver a 4-step closed-loop optimization system:

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  1. SENSOR DATA  │ ───> │  2. AI ANALYSIS  │ ───> │3. AUTO ACTIONS   │ ───> │ 4. YIELD & PROFIT│
└──────────────────┘      └──────────────────┘      └──────────────────┘      └──────────────────┘
  - Real-time IoT           - Crop insights           - Irrigation/Misting      - Max production
  - Conditions tracking     - Predictive optimization - LED spectrum            - Forward contracts
  - Temp, pH, Humidity, EC  - Visual threat scans     - Dosing adjustments      - Operational capital
```

1. **Sensor Data:** Continuous, real-time IoT monitoring of key environmental metrics (Temperature, pH, Soil Moisture, Humidity, EC).
2. **AI Analysis:** Advanced AI model generating intelligent crop prescriptions and predictive growth analytics.
3. **Automated Actions:** Smart actuators automatically responding to instructions (Irrigation, LED Spectrum tuning, Nutrient N-P-K dosing pumps).
4. **Better Yield & Profit:** Maximized production capacity, secured forward-purchase distributor contracts, and unlocked low-interest agrotech capital.

---

## 🎮 What Farmers Get

### 1. Pre-Harvest Token Allocation Ledger
A Web3 framework that eliminates market price volatility by pre-selling crop yields as utility tokens.
* **Crop Tokens:** Supports unique crop-specific asset tokens: `AURA-LET` (Lettuce), `AURA-BAS` (Basil), and `AURA-TOM` (Tomato).
* **On-Chain Allocation (Arbitrum Sepolia):** Automatically mints a total supply of 50,000 AURA tokens per cycle and splits them among key stakeholders:
  * *Wholesale/Distributors (e.g., FAMA):* Pre-harvest wholesale allocation locked in escrow.
  * *Retail Partners (e.g., Jaya Grocer, Village Grocer, AEON):* Premium supermarket shelf allocations.
  * *Institutional Lenders (e.g., Agrobank, CIMB Islamic):* Forward-purchase yield collateral.
* **0% Pre-Harvest Risk:** Secures revenue contracts before seeds are even planted, protecting urban growers from post-harvest demand drops.

### 2. Smart Escrow Procurement & Underwriting
Accelerates equipment scaling and financial access through real-time operational underwriting.
* **One-Click Smart Escrow Procurement:** Deploy automated purchasing agreements directly to verified suppliers. The transaction is fully secured in escrow and validated on the Arbitrum Sepolia testnet, linking directly to successful Arbiscan explorer pages to prevent 404 tracking errors.
* **Automated Credit Underwriting:** Analyzes live IoT operational metrics and historical system alerts to calculate a real-time **Stability Score**. A high score automatically qualifies the farm for low-interest financing programs (e.g., Agrobank Malaysia's Special Tier A funding at **3.2%** interest).

### 3. Living Farm Digital Twin & AI Autopilot
A high-fidelity, real-time interactive 3D browser simulation of the shipping container farm that mirrors the live IoT telemetry.
* **Focused Inspection Overlay:** Camera orbits and zooms into specific rack shelves, pumps, reservoirs, or dosing systems upon interaction.
* **Red Dot Precision Alerts:** Floating visual indicators that physically pinpoint failures, environmental breaches, or biological stresses on the 3D meshes.
* **Single AI Brain (Gemini 3.1 Flash Lite):** Uses the modern Google GenAI SDK to handle both text diagnostics (evaluating sensor drift to prescribe microclimate rectifications) and crop vision analysis (multimodal scans of plant health, identifying diseases or nutrient deficiencies).
* **Closed-Loop Actuators:** Automatically toggles ventilation fans, misting sprays, or dosing valves in response to live physics calculations.

*Note: The platform also features secondary remote overrides, allowing managers to receive instant telemetry summaries or toggle manual actuator states remotely via WhatsApp.*

---

## 🔌 Hardware Implementation

AuraFarm is built to be hardware-agnostic, interfacing smoothly with low-cost standard industrial and consumer IoT hardware:

* **Microcontroller / Compute:** 
  * **ESP32:** High-performance, low-cost Wi-Fi microcontroller for real-time sensor ingestion and actuator control.
  * **Raspberry Pi:** Central gateway hub for managing WebSocket streams and local automation fallback rules.
* **Sensors:**
  * **DHT22:** High-accuracy ambient Temperature & Humidity tracking.
  * **pH Sensor:** Hydroponic reservoir acidity/alkalinity monitor.
  * **EC Sensor:** Electrical Conductivity tracking for total dissolved solids (nutrient concentration).
  * **Water Level Sensor:** Non-contact liquid level monitor to prevent reservoir dry-runs.
  * **Light Sensor:** Ambient PAR/lux light level monitoring.
  * **ESP32-CAM:** High-precision crop camera vision capture for biological disease scans.
* **Actuators:**
  * **Smart LED Grow Lights:** Dynamic red/blue/purple spectrum light panels.
  * **Water Pump + Solenoid Valve:** Closed-loop nutrient irrigation feed loops.
  * **Alkaline/Acid & N-P-K Dosing Valves:** Solenoid valves for automated reservoir dosing.

---

## 🌱 Sustainability & Impact Metrics

* 💧 **Water Conservation:** Saves up to **90%** of water compared to traditional soil farming through recirculating closed-loop hydroponics.
* ⚡ **Energy Optimization:** Smart LED timers and dynamic ventilation speeds minimize power draw (Malaysian TNB agriculture tariff optimizations).
* 🚫 **0% Pre-Harvest Risk:** B2B forward-allocation ledgers lock in crop sales before seeds are sown, eliminating market price fluctuations and supply waste.

---

## 💻 Tech Stack

* **Frontend:** React 19, Three.js, React Three Fiber, Zustand (Shallow selectors), Framer Motion, Tailwind CSS.
* **Backend:** FastAPI (Python), WebSockets.
* **AI & Computer Vision:** Modern Google GenAI SDK powered entirely by **Gemini 3.1 Flash Lite** for text recommendations and multimodal vision.
* **Web3 Integration:** Arbitrum Sepolia Testnet smart contracts and ERC-20 utility tokens.
* **Messaging & Transcription:** Twilio (WhatsApp Integration) and Groq Whisper (voice command parsing).

---

## 🛠️ Setup & Installation

### Prerequisites
* Node.js (v18+)
* Python 3.10+
* (Optional) ESP32 with sensors for physical integration.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Unix or macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload
```

---

## 🔗 Links & Resources

- **Presentation (Canva):** [View Presentation](https://canva.link/g0ql7cf06l0dfp2)
- **Demo Video:** [Watch Demo](https://youtu.be/W_9h3Tr46Ao)

## 📜 Attributions

AuraFarm uses high-quality 3D assets from the community. We are grateful to the following creators:
- **Vertical Rack:** [ModuLife](https://sketchfab.com/3d-models/modulife-with-leafy-attachments-f9e88013172d4ddb98075ab14a9b2905) by [LemnaLife](https://sketchfab.com/LemnaLife) (CC-BY-4.0)
- **Lettuce:** [Lettuce Model](https://sketchfab.com/3d-models/lettuce-1dfd949d61ae4d378d7c65571746f693) by [SirWyrm](https://sketchfab.com/SirWyrm) (CC-BY-4.0)
- **Water Pump:** [1GPM Pump](https://sketchfab.com/3d-models/water-pump-1gpm-1544dfaf46ea474483a65653b455a592) by [umcosta79](https://sketchfab.com/umcosta79) (CC-BY-4.0)
- **Water Tank:** [Plastic Water Tank](https://sketchfab.com/3d-models/plastic-water-tank-b4de261f3ad94b1c8d91070fbdca3d08) by [Akshat](https://sketchfab.com/shooter24994) (CC-BY-4.0)
- **LED Bar:** [LED Bar](https://sketchfab.com/3d-models/led-bar-dc108ebeff934fea8784e80b908b501e) by [artsx](https://sketchfab.com/artsxnotxx) (Standard License)

---

## 👥 Team Meow3Wang
Developed with ❤️ for **UTMxHackathon**.

- **Frontend Dashboard, Voice Command & WhatsApp:** [Teo Jing Ying](https://github.com/JY156) (@JY156)
- **Frontend 3D Digital Twin & UIUX:** [Nicol Heng Si Yi](https://github.com/nicolheng) (@nicolheng)
- **Backend, System Architecture & Lead Presenter:** [Tan Syn Yee](https://github.com/synyee) (@synyee)

---
© 2026 Team Meow3Wang. All rights reserved.