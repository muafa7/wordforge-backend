# 📘 WordForge – Multiplayer Word Game with Trie Engine

WordForge is a **real-time multiplayer word game** inspired by Boggle. Players trace words on a dynamic grid while the backend validates them using a high-performance **Trie dictionary engine**. The game features live rooms, leaderboards, and synchronized timed rounds powered by WebSockets.

---

## 🚀 Features

### 🎮 Real-Time Multiplayer
- Live rooms with player join/leave updates  
- WebSocket / Socket.IO sync  
- Instant leaderboard updates  

### 🔠 Fast Dictionary Validation (Trie)
- In-memory Trie for O(word_length) lookup  
- Fast prefix checks  
- Server-side anti-cheat validation  

### 🧩 Interactive Grid UI
- 4×4 or 5×5 letter grids  
- Drag or click to trace words  
- Adjacent tile enforcement  
- Smooth feedback and animations  

### 🏆 Scoring & Rounds
- Scoring based on word length and rarity  
- Duplicate-word prevention  
- Global round timer  
- Automatic new-round generation
