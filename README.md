<p align="center">
  <img src="assets/banner.svg" alt="SPEED ORDER — Endless Highway Traffic Racer" width="100%" />
</p>

<p align="center">
  <a href="https://github.com/RITAM-DAWN237/SPEED-ORDER"><img src="https://img.shields.io/badge/Three.js-WebGL_Arcade-38bdf8?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js"></a>
  <a href="https://github.com/RITAM-DAWN237/SPEED-ORDER"><img src="https://img.shields.io/badge/Vite-5.4-f59e0b?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"></a>
  <a href="https://github.com/RITAM-DAWN237/SPEED-ORDER"><img src="https://img.shields.io/badge/Vehicles-42_Unique_Cars-10b981?style=for-the-badge" alt="42 Cars"></a>
  <a href="https://github.com/RITAM-DAWN237/SPEED-ORDER"><img src="https://img.shields.io/badge/Journey-50_KM_Interstate-ec4899?style=for-the-badge" alt="50 KM Journey"></a>
</p>

---

# SPEED ORDER — Endless Highway Traffic Racer

A high-performance 3D/Voxel Highway Traffic Racer built from the ground up with **Three.js** and **Vite**, featuring authentic Soner Kara *Traffic Racer* physics, continuous procedural interstate streaming, and vibrant Indian state landscapes.

---

## 🌟 Key Features

### 🛣️ Seamless 50 KM Continuous Interstate Highway
- Drive through **10 continuous Indian states** across 50 kilometers with **zero loading screens**.
- Inter-state mountain transition tunnels seamlessly connect every 5 KM stage.

### 🏛️ Famous State Monuments
Historic roadside monuments precede each 5 KM transition tunnel:
1. **Punjab**: Sri Harmandir Sahib (*Golden Temple & Amrit Sarovar Reflecting Pool*)
2. **Rajasthan**: Hawa Mahal (*Palace of Winds pink sandstone facade*)
3. **Himachal Pradesh**: Hadimba Pagoda Temple (*Tiered wooden pagoda roof amidst cedars*)
4. **Meghalaya**: Double-Decker Living Root Bridge
5. **Assam**: Kaziranga Rhino Monument & Kamakhya Shikhara (*Optimized 60 FPS forest canopy*)
6. **Kashmir**: Pari Mahal (*Palace of Fairies terraced arcades*)
7. **Maharashtra**: Gateway of India (*Basalt triumphal arch & turrets*)
8. **Goa**: Basilica of Bom Jesus (*Baroque 3-tier laterite cathedral*)
9. **Kerala**: Chinese Fishing Nets & Fort Kochi Lighthouse
10. **Uttar Pradesh**: Taj Mahal (*Ivory marble sunrise vista leading into the finish*)

### 🚗 42 Unique Vehicles Catalog
- Every single vehicle features a **strictly unique top speed** (ranging from **165 km/h** up to **400 km/h**).
- Balanced economic progression from starter cars ($0) up to elite hypercars ($1,500,000).
- Full custom paint liveries and custom sport wheel rim customizers.

### 🌃 Vibrant Maharashtra Night City
- Elevated roadside footpaths with animated pedestrians.
- Roadside cafes (`☕ CAFE MUMBAI`) with awnings and patio umbrella tables.
- Two-story diners (`🍽️ BISTRO 24/7`), municipal parks with glowing water fountains, and towering skyscrapers.
- **Emergency medical ambulances** navigating through traffic with flashing red/blue lightbars.

### ⛽ Fuel System, Limp Mode & Pitstops
- Fuel consumption scales dynamically with speed. Reaching 0% fuel engages **50 km/h limp mode**.
- Roadside gas stations appear every 1 KM for **Full Tank Refueling ($100)** and **Nitro Canisters ($300)**.
- 5-second Nitro boost gives a speed surge and **crash immunity** (0 lives lost during nitro).

### 🏁 50 KM Finish Garage & Expedition Summary
- At 50 KM, your vehicle enters the Grand Finish Garage hangar.
- The heavy industrial blast door slides down and seals the garage shut.
- Complete expedition statistics modal displays:
  - **No. of Overtakes**
  - **Refueling Count**
  - **Nitros Used**
  - **Total Cash Earned**
  - **Elapsed Time**

### 📸 In-Game Advertisement Screenshot Exporter
- Press **`F9`** or click the in-game **`📸 TAKE AD SCREENSHOT`** camera button at any time.
- Instantly captures uncompressed full-resolution PNG screenshots saved directly to `screenshots/` and triggers a browser download.

---

## 🎮 Controls

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Accelerate** | `W` / `↑` Arrow | Auto / Throttle |
| **Brake / Reverse** | `S` / `↓` Arrow | Left Brake Pedal |
| **Steer Left** | `A` / `←` Arrow | Left Screen Button / Tilt |
| **Steer Right** | `D` / `→` Arrow | Right Screen Button / Tilt |
| **Engage Nitro** | `SPACE` | Nitro Canister HUD Button |
| **Refuel ($100)** | `E` | Pitstop HUD Button |
| **Buy Nitro ($300)** | `B` | Pitstop HUD Button |
| **Pause / Resume** | `P` / `ESC` | Pause Button Top Right |
| **Screenshot** | `F9` | 📸 Camera Button Top Right |

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/RITAM-DAWN237/SPEED-ORDER.git

# Enter project directory
cd SPEED-ORDER

# Install dependencies
npm install

# Start local dev server
npm run dev
```

Open your browser at **`http://localhost:3000`**.

---

## 🛠️ Tech Stack
- **Three.js** (WebGL 3D Rendering & PCF Soft Shadows)
- **Vite** (Lightning-fast dev server and build tool)
- **Web Audio API** (Procedural engine audio oscillators and effects)
- **HTML5 Canvas / CSS3** (Soner Kara style arcade UI with 4px soft corners)
