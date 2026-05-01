import { useState, useCallback } from "react";

// ─── NEOSAI AESTHETIC CONSTANTS ──────────────────────────────────────────────
const STYLE_PRESETS = [
  {
    id: "afro-crystalline",
    label: "AFRO-CRYSTALLINE",
    color: "#ffd700",
    icon: "✦",
    base: "afrofuturist anime, kemetic glyphwork, yoruba textile geometry, obsidian skin tones, numen gold trim, crystalline sacred geometry, bioluminescent edge lighting, deep space black void background",
    lighting: "volumetric god rays, divine yellow rim light, purple plasma energy, bioluminescent edge light",
    quality: "ultra-detailed, crisp anatomy, ornate symbols, 8k resolution, sharp edges, cinematic composition"
  },
  {
    id: "vedic-nakshatra",
    label: "VEDIC NAKSHATRA",
    color: "#9f7aea",
    icon: "◈",
    base: "vedic anime, nakshatra motifs, indigo cosmic background, lotus mandala geometry, Sanskrit energy glyphs, celestial warrior aesthetic, divine feminine power",
    lighting: "moonlight silver, deep indigo atmosphere, golden chakra glow, violet aura field",
    quality: "ultra-detailed, flowing silk textures, cosmic depth, divine proportions, 8k cinematic"
  },
  {
    id: "yoruba-orisha",
    label: "YORUBA · ORISHA",
    color: "#ff6b35",
    icon: "⚡",
    base: "yoruba orisha anime, Shango lightning aesthetic, ase energy field, cowrie shell ornaments, red and white sacred colors, ancestral fire, West African compound architecture background",
    lighting: "electric storm atmosphere, copper and gold light, ancestral fire glow, crimson energy tendrils",
    quality: "ultra-detailed, powerful anatomy, sacred symbol integration, dynamic pose, 8k cinematic"
  },
  {
    id: "kemetic-void",
    label: "KEMETIC VOID",
    color: "#00ffcc",
    icon: "𓂀",
    base: "ancient Egyptian anime, kemetic aesthetic, hieroglyphic energy, Ma'at feather motifs, Eye of Horus glow, Nile river atmosphere, pyramid geometry, obsidian and gold palette",
    lighting: "desert starlight, gold and lapis lazuli, solar disc radiance, deep teal night sky",
    quality: "ultra-detailed, hieroglyphic detail layers, sacred proportion, majestic scale, 8k cinematic"
  },
  {
    id: "zero-point",
    label: "ZERO-POINT FIELD",
    color: "#4da6ff",
    icon: "∞",
    base: "quantum consciousness anime, zero-point energy field, scalar wave patterns, biophotonic aura, DNA helix background, tachyonic speed lines, superposition particle effects",
    lighting: "cyan plasma glow, electric blue zero-point field, white quantum light, subtle green data streams",
    quality: "ultra-detailed, scientific precision, energy field coherence, dimensional depth, 8k cinematic"
  },
  {
    id: "lucid-prophecy",
    label: "LUCID PROPHECY",
    color: "#ff6b9d",
    icon: "☽",
    base: "psychic anime, lucid dream aesthetic, third eye activation, astral projection visual, cosmic timeline, prophetic vision motifs, time spiral geometry, iridescent consciousness field",
    lighting: "dreamy magenta and gold, astral silver light, cosmic purple atmosphere, time-stream iridescence",
    quality: "ultra-detailed, dreamlike depth, iridescent color grade, mystical atmosphere, 8k cinematic"
  }
];

const CAMERA_PRESETS = [
  { id: "portrait", label: "PORTRAIT", desc: "85mm · f/1.8", prompt: "cinematic 85mm portrait, shallow depth of field, center-framed subject, heroic stance" },
  { id: "wide", label: "WIDE SHOT", desc: "24mm · environmental", prompt: "cinematic wide shot, 24mm lens, full environment visible, epic scale composition" },
  { id: "closeup", label: "CLOSE-UP", desc: "135mm · face/detail", prompt: "extreme close-up 135mm, face and eyes detail, emotional intensity, shallow DOF" },
  { id: "aerial", label: "AERIAL", desc: "bird's eye · god view", prompt: "aerial bird's eye view, god perspective, vast scale, topographic composition" },
  { id: "dutch", label: "DUTCH ANGLE", desc: "tilted · tension", prompt: "dutch angle tilt, kinetic tension, dynamic diagonal composition, action energy" },
  { id: "lowangle", label: "LOW ANGLE", desc: "heroic · powerful", prompt: "low angle upshot, heroic perspective, towering subject, sky backdrop, power pose" }
];

const NEGATIVE_PROMPT = "lowres, blurry, jpeg artifacts, watermark, logo, text overlay, deformed hands, extra limbs, fused fingers, bad anatomy, bad proportions, oversaturated, flat lighting, noisy, duplicate face, uncanny eyes, generic AI, plastic skin, doll-like, muddy details, western cartoon style, simple background, poor composition";

// ─── IMAGE GENERATION VIA POLLINATIONS ───────────────────────────────────────
function buildImageUrl(prompt, width = 768, height = 1024, seed = null) {
  const encoded = encodeURIComponent(prompt);
  const s = seed || Math.floor(Math.random() * 999999);
  return `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=${width}&height=${height}&seed=${s}&nologo=true&enhance=true`;
}

// ─── AI PROMPT ENGINEER via Anthropic API ────────────────────────────────────
async function engineerPrompt(subject, style, camera, mood, extra) {
  const systemPrompt = `You are the NEOSAI APEX DAO Cinematic Anime Prompt Engineer. Your job is to transform basic descriptions into masterclass-level Stable Diffusion / Flux image generation prompts for the NEOSAI aesthetic. 

Rules:
- Always build on the Afrofuturist / Kemetic / Yoruba / sacred geometry foundation
- Output ONLY the final prompt string — no explanation, no preamble
- Include: subject, composition, lighting, style tokens, color grade, quality tokens
- Max 200 words
- End with: anime key visual, masterpiece, best quality, 8k`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: `Subject: ${subject}\nStyle Preset: ${style.label} — ${style.base}\nCamera: ${camera.prompt}\nMood: ${mood}\nExtra details: ${extra || "none"}\n\nEngineer the optimal prompt:`
        }]
      })
    });
    const data = await res.json();
    return data.content?.[0]?.text || buildFallbackPrompt(subject, style, camera, mood);
  } catch {
    return buildFallbackPrompt(subject, style, camera, mood);
  }
}

function buildFallbackPrompt(subject, style, camera, mood) {
  return `${subject}, ${camera.prompt}, ${style.base}, ${style.lighting}, mood: ${mood}, ${style.quality}, anime key visual, masterpiece, best quality`;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function CinematicAnimeCreator() {
  const [subject, setSubject] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0]);
  const [selectedCamera, setSelectedCamera] = useState(CAMERA_PRESETS[0]);
  const [mood, setMood] = useState("wonder, pure joy, sacred intensity, harmony and rhythm");
  const [extra, setExtra] = useState("");
  const [engineeredPrompt, setEngineeredPrompt] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("CREATE");
  const [selectedImage, setSelectedImage] = useState(null);
  const [variations, setVariations] = useState(2);

  const handleEngineerPrompt = async () => {
    if (!subject.trim()) return;
    setPromptLoading(true);
    const p = await engineerPrompt(subject, selectedStyle, selectedCamera, mood, extra);
    setEngineeredPrompt(p);
    setPromptLoading(false);
  };

  const handleGenerate = useCallback(async () => {
    const prompt = engineeredPrompt || buildFallbackPrompt(subject, selectedStyle, selectedCamera, mood);
    if (!prompt) return;

    setLoading(true);
    setImages([]);
    setActiveTab("GALLERY");

    const newImages = Array.from({ length: variations }, (_, i) => ({
      id: Date.now() + i,
      url: buildImageUrl(prompt + `, ${STYLE_PRESETS[i % STYLE_PRESETS.length].lighting}`, 768, 1024),
      seed: Math.floor(Math.random() * 999999),
      prompt,
      status: "loading"
    }));

    setImages(newImages);

    // Simulate progressive loading feedback
    setTimeout(() => setLoading(false), 1500);
  }, [engineeredPrompt, subject, selectedStyle, selectedCamera, mood, variations]);

  const handleVariation = (img) => {
    const newSeed = Math.floor(Math.random() * 999999);
    const newUrl = buildImageUrl(img.prompt, 768, 1024, newSeed);
    setImages(prev => [...prev, { ...img, id: Date.now(), url: newUrl, seed: newSeed }]);
  };

  return (
    <div style={{
      background: "#050508",
      minHeight: "100vh",
      fontFamily: "'Courier New', monospace",
      color: "#e0e0e0",
      overflow: "hidden"
    }}>
      {/* Animated background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at 20% 20%, ${selectedStyle.color}08 0%, transparent 60%),
                     radial-gradient(ellipse at 80% 80%, #9f7aea08 0%, transparent 60%)`
      }} />

      {/* Header */}
      <div style={{
        position: "relative", zIndex: 1,
        background: "linear-gradient(135deg, #0a0a14 0%, #0d0620 50%, #0a0a14 100%)",
        borderBottom: `1px solid ${selectedStyle.color}30`,
        padding: "18px 16px 14px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "8px",
            background: `${selectedStyle.color}20`,
            border: `1px solid ${selectedStyle.color}60`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", color: selectedStyle.color
          }}>{selectedStyle.icon}</div>
          <div>
            <div style={{ fontSize: "10px", color: selectedStyle.color, letterSpacing: "3px" }}>
              ARTOPS OS · CINEMATIC ENGINE V2
            </div>
            <div style={{ fontSize: "17px", fontWeight: "bold", color: "#fff", letterSpacing: "1px" }}>
              ANIME CREATOR
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: "8px", color: "#555", letterSpacing: "1px" }}>POWERED BY</div>
            <div style={{ fontSize: "9px", color: selectedStyle.color }}>FLUX · POLLINATIONS</div>
          </div>
        </div>

        {/* Style indicator bar */}
        <div style={{
          padding: "7px 12px",
          background: `${selectedStyle.color}10`,
          border: `1px solid ${selectedStyle.color}30`,
          borderRadius: "4px",
          fontSize: "9px", color: selectedStyle.color, letterSpacing: "1px"
        }}>
          ⟡ ACTIVE STYLE: {selectedStyle.label} · {selectedStyle.icon} · ControlNet: FLUX ULTRA
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "#0a0a14", borderBottom: "1px solid #1a1a2e", position: "relative", zIndex: 1 }}>
        {["CREATE", "GALLERY", "PROMPT LAB", "DISCIPLINE"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            flex: 1, padding: "11px 4px",
            background: activeTab === t ? "#12121e" : "transparent",
            border: "none",
            borderBottom: activeTab === t ? `2px solid ${selectedStyle.color}` : "2px solid transparent",
            color: activeTab === t ? selectedStyle.color : "#444",
            fontSize: "8px", letterSpacing: "1.5px",
            cursor: "pointer", fontFamily: "'Courier New', monospace",
            transition: "all 0.2s"
          }}>{t}</button>
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── CREATE TAB ── */}
        {activeTab === "CREATE" && (
          <div style={{ padding: "16px" }}>

            {/* Style Selector */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "9px", color: "#555", letterSpacing: "2px", marginBottom: "8px" }}>
                SELECT AESTHETIC · {STYLE_PRESETS.length} STYLES
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                {STYLE_PRESETS.map(s => (
                  <button key={s.id} onClick={() => setSelectedStyle(s)} style={{
                    padding: "10px 6px",
                    background: selectedStyle.id === s.id ? `${s.color}20` : "#0d0d1a",
                    border: `1px solid ${selectedStyle.id === s.id ? s.color : "#1a1a2e"}`,
                    borderRadius: "6px",
                    color: selectedStyle.id === s.id ? s.color : "#555",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "4px"
                  }}>
                    <span style={{ fontSize: "16px" }}>{s.icon}</span>
                    <span style={{ fontSize: "7px", letterSpacing: "0.5px", textAlign: "center", lineHeight: "1.3" }}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Input */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "9px", color: "#555", letterSpacing: "2px", marginBottom: "6px" }}>
                SUBJECT / CHARACTER CONCEPT
              </div>
              <textarea
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g., Mali — a young warrior with a sixth finger, emerging from the void, wearing Kemetic armor, wielding a blade of compressed 528Hz frequencies..."
                rows={3}
                style={{
                  width: "100%", background: "#0d0d1a",
                  border: `1px solid ${selectedStyle.color}40`,
                  borderRadius: "4px", padding: "10px",
                  color: "#e0e0e0", fontSize: "11px",
                  fontFamily: "'Courier New', monospace",
                  outline: "none", resize: "none", boxSizing: "border-box",
                  lineHeight: "1.5"
                }}
              />
            </div>

            {/* Camera */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "9px", color: "#555", letterSpacing: "2px", marginBottom: "6px" }}>
                CAMERA PROTOCOL
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "5px" }}>
                {CAMERA_PRESETS.map(c => (
                  <button key={c.id} onClick={() => setSelectedCamera(c)} style={{
                    padding: "8px 4px",
                    background: selectedCamera.id === c.id ? `${selectedStyle.color}15` : "#0d0d1a",
                    border: `1px solid ${selectedCamera.id === c.id ? selectedStyle.color : "#1a1a2e"}`,
                    borderRadius: "4px",
                    color: selectedCamera.id === c.id ? selectedStyle.color : "#555",
                    cursor: "pointer", fontSize: "8px", letterSpacing: "0.5px",
                    fontFamily: "'Courier New', monospace"
                  }}>
                    <div style={{ fontWeight: "bold" }}>{c.label}</div>
                    <div style={{ fontSize: "7px", opacity: 0.7, marginTop: "2px" }}>{c.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mood */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "9px", color: "#555", letterSpacing: "2px", marginBottom: "6px" }}>MOOD / ATMOSPHERE</div>
              <input
                value={mood}
                onChange={e => setMood(e.target.value)}
                style={{
                  width: "100%", background: "#0d0d1a",
                  border: `1px solid ${selectedStyle.color}30`,
                  borderRadius: "4px", padding: "10px",
                  color: "#e0e0e0", fontSize: "11px",
                  fontFamily: "'Courier New', monospace", outline: "none", boxSizing: "border-box"
                }}
              />
            </div>

            {/* Extra Details */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "9px", color: "#555", letterSpacing: "2px", marginBottom: "6px" }}>EXTRA DETAILS (OPTIONAL)</div>
              <input
                value={extra}
                onChange={e => setExtra(e.target.value)}
                placeholder="specific symbols, colors, props, background elements..."
                style={{
                  width: "100%", background: "#0d0d1a",
                  border: "1px solid #1a1a2e",
                  borderRadius: "4px", padding: "10px",
                  color: "#e0e0e0", fontSize: "11px",
                  fontFamily: "'Courier New', monospace", outline: "none", boxSizing: "border-box"
                }}
              />
            </div>

            {/* Variations */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "9px", color: "#555", letterSpacing: "2px" }}>VARIATIONS:</div>
              {[1, 2, 3, 4].map(n => (
                <button key={n} onClick={() => setVariations(n)} style={{
                  width: "32px", height: "32px",
                  background: variations === n ? `${selectedStyle.color}20` : "#0d0d1a",
                  border: `1px solid ${variations === n ? selectedStyle.color : "#1a1a2e"}`,
                  borderRadius: "4px", color: variations === n ? selectedStyle.color : "#555",
                  cursor: "pointer", fontSize: "12px", fontWeight: "bold",
                  fontFamily: "'Courier New', monospace"
                }}>{n}</button>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleEngineerPrompt}
                disabled={!subject.trim() || promptLoading}
                style={{
                  flex: 1, padding: "12px",
                  background: promptLoading ? "#0d0d1a" : `${selectedStyle.color}10`,
                  border: `1px solid ${selectedStyle.color}50`,
                  borderRadius: "6px", color: selectedStyle.color,
                  fontSize: "9px", letterSpacing: "2px",
                  cursor: subject.trim() ? "pointer" : "not-allowed",
                  fontFamily: "'Courier New', monospace", fontWeight: "bold",
                  opacity: subject.trim() ? 1 : 0.4
                }}
              >
                {promptLoading ? "⟳ ENGINEERING..." : "⟡ AI ENGINEER PROMPT"}
              </button>
              <button
                onClick={handleGenerate}
                disabled={!subject.trim() && !engineeredPrompt}
                style={{
                  flex: 1, padding: "12px",
                  background: (subject.trim() || engineeredPrompt) ? `${selectedStyle.color}25` : "#0d0d1a",
                  border: `1px solid ${selectedStyle.color}`,
                  borderRadius: "6px", color: selectedStyle.color,
                  fontSize: "9px", letterSpacing: "2px",
                  cursor: (subject.trim() || engineeredPrompt) ? "pointer" : "not-allowed",
                  fontFamily: "'Courier New', monospace", fontWeight: "bold",
                  opacity: (subject.trim() || engineeredPrompt) ? 1 : 0.4
                }}
              >
                ⚡ GENERATE
              </button>
            </div>

            {/* Engineered Prompt Preview */}
            {engineeredPrompt && (
              <div style={{ marginTop: "14px", padding: "12px", background: "#0d0d1a", border: `1px solid ${selectedStyle.color}30`, borderRadius: "6px" }}>
                <div style={{ fontSize: "8px", color: "#555", letterSpacing: "2px", marginBottom: "6px" }}>
                  ⟡ AI-ENGINEERED PROMPT
                </div>
                <div style={{ fontSize: "10px", color: "#bbb", lineHeight: "1.6" }}>
                  {engineeredPrompt}
                </div>
                <button
                  onClick={() => navigator.clipboard?.writeText(engineeredPrompt)}
                  style={{
                    marginTop: "8px", padding: "5px 12px",
                    background: "transparent", border: `1px solid ${selectedStyle.color}40`,
                    borderRadius: "3px", color: selectedStyle.color,
                    fontSize: "8px", cursor: "pointer",
                    fontFamily: "'Courier New', monospace"
                  }}
                >COPY PROMPT</button>
              </div>
            )}
          </div>
        )}

        {/* ── GALLERY TAB ── */}
        {activeTab === "GALLERY" && (
          <div style={{ padding: "16px" }}>
            {loading && (
              <div style={{ textAlign: "center", padding: "30px", color: selectedStyle.color }}>
                <div style={{ fontSize: "24px", marginBottom: "10px", animation: "spin 2s linear infinite" }}>◈</div>
                <div style={{ fontSize: "11px", letterSpacing: "2px" }}>RENDERING · FLUX ENGINE ACTIVE</div>
                <div style={{ fontSize: "9px", color: "#555", marginTop: "6px" }}>Pollinations.ai · Flux Ultra · {variations} renders queued</div>
              </div>
            )}

            {images.length === 0 && !loading && (
              <div style={{ textAlign: "center", padding: "40px", color: "#333" }}>
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>🎨</div>
                <div style={{ fontSize: "11px", letterSpacing: "2px" }}>NO RENDERS YET</div>
                <div style={{ fontSize: "9px", marginTop: "6px" }}>Go to CREATE and generate your first image</div>
              </div>
            )}

            {/* Full-screen selected image */}
            {selectedImage && (
              <div style={{ marginBottom: "16px" }}>
                <img
                  src={selectedImage.url}
                  alt="Selected render"
                  style={{ width: "100%", borderRadius: "8px", border: `1px solid ${selectedStyle.color}40` }}
                  onError={e => { e.target.style.display = "none"; }}
                />
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button onClick={() => handleVariation(selectedImage)} style={{
                    flex: 1, padding: "10px",
                    background: `${selectedStyle.color}15`,
                    border: `1px solid ${selectedStyle.color}50`,
                    borderRadius: "4px", color: selectedStyle.color,
                    fontSize: "9px", letterSpacing: "2px",
                    cursor: "pointer", fontFamily: "'Courier New', monospace"
                  }}>⟳ NEW VARIATION</button>
                  <button onClick={() => setSelectedImage(null)} style={{
                    padding: "10px 16px",
                    background: "transparent", border: "1px solid #2a1a4e",
                    borderRadius: "4px", color: "#555",
                    fontSize: "9px", cursor: "pointer",
                    fontFamily: "'Courier New', monospace"
                  }}>✕</button>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {images.map(img => (
                <div key={img.id} onClick={() => setSelectedImage(img)}
                  style={{ position: "relative", cursor: "pointer", borderRadius: "6px", overflow: "hidden", border: `1px solid ${selectedStyle.color}20` }}>
                  <img
                    src={img.url}
                    alt="Generated anime render"
                    style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
                    onError={e => {
                      e.target.parentElement.style.background = "#0d0d1a";
                      e.target.style.display = "none";
                    }}
                  />
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    padding: "8px", background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                    fontSize: "8px", color: selectedStyle.color, letterSpacing: "1px"
                  }}>
                    SEED: {img.seed}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PROMPT LAB TAB ── */}
        {activeTab === "PROMPT LAB" && (
          <div style={{ padding: "16px" }}>
            <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "14px" }}>
              MASTER PROMPT TEMPLATES · NEOSAI AESTHETIC
            </div>

            {/* Mali Character Template */}
            <div style={{ marginBottom: "12px", background: "#0d0d1a", border: `1px solid #ffd70030`, borderRadius: "6px", padding: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: "bold", color: "#ffd700", marginBottom: "8px" }}>
                ✦ MALI — THE REMEMBERING FINGER
              </div>
              <div style={{ fontSize: "10px", color: "#bbb", lineHeight: "1.7", marginBottom: "10px" }}>
                Mali — the Remembering Finger, center-framed, heroic stance, clean silhouette, deep space black void, gold/yellow rim light, purple plasma glyphs, cinematic 85mm portrait, shallow depth of field, volumetric god rays, bioluminescent edge light, soft haze. Style: kemetic glyphwork, yoruba textile geometry, vedic nakshatra motifs. Mood: wonder, pure joy, sacred intensity. Color grade: deep black background, divine yellow highlights, esoteric purple energy, subtle cyan UI glow. Details: ultra-detailed, crisp anatomy, coherent hands, six-finger truth, ornate symbols, 8k.
              </div>
              <button onClick={() => { setEngineeredPrompt("Mali — the Remembering Finger, center-framed, heroic stance, clean silhouette, deep space black void, gold/yellow rim light, purple plasma glyphs, cinematic 85mm portrait, shallow depth of field, volumetric god rays, bioluminescent edge light, soft haze. Style: kemetic glyphwork, yoruba textile geometry, vedic nakshatra motifs. Mood: wonder, pure joy, sacred intensity. Color grade: deep black background, divine yellow highlights, esoteric purple energy, subtle cyan UI glow. ultra-detailed, crisp anatomy, six-finger truth, ornate symbols, 8k, anime key visual"); setActiveTab("CREATE"); }}
                style={{ padding: "6px 14px", background: "rgba(255,215,0,0.1)", border: "1px solid #ffd70050", borderRadius: "3px", color: "#ffd700", fontSize: "8px", cursor: "pointer", fontFamily: "'Courier New', monospace" }}>
                USE THIS TEMPLATE
              </button>
            </div>

            {/* Guardian Templates */}
            {[
              { name: "SHANGO — THE SURGE", color: "#ff6b35", prompt: "Shango warrior, lightning and fire deity anime, deep obsidian complexion, hair woven into perfect icosahedron locs tipped with solid gold, chest bears D=Gx3 equation in glowing scarification, Yoruba sacred garments, electric storm background, power 99 stance, 85mm cinematic portrait, ultra-detailed, 8k, anime key visual, masterpiece" },
              { name: "MA'AT — COSMIC BALANCE", color: "#ffd700", prompt: "Ma'at goddess anime, cosmic balance deity, golden feather wings of truth, scales of justice, luminous white garments with golden hieroglyphic trim, zero entropy field, deep lapis lazuli background, perfect symmetry composition, divine feminine power, 85mm cinematic portrait, ultra-detailed, 8k, anime key visual, masterpiece" },
              { name: "AUSET — THE RESTORER", color: "#9f7aea", prompt: "Auset goddess anime, restoration and healing deity, wings spread in cosmic embrace, gathering scattered light fragments, iridescent violet and gold palette, sacred symbol field, restoration energy streams, deep space background, 85mm cinematic portrait, ultra-detailed, 8k, anime key visual, masterpiece" }
            ].map(t => (
              <div key={t.name} style={{ marginBottom: "10px", background: "#0d0d1a", border: `1px solid ${t.color}30`, borderRadius: "6px", padding: "12px" }}>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: t.color, marginBottom: "6px" }}>{t.name}</div>
                <div style={{ fontSize: "9px", color: "#888", lineHeight: "1.6", marginBottom: "8px" }}>{t.prompt.substring(0, 120)}...</div>
                <button onClick={() => { setEngineeredPrompt(t.prompt); setActiveTab("CREATE"); }}
                  style={{ padding: "5px 12px", background: `${t.color}10`, border: `1px solid ${t.color}40`, borderRadius: "3px", color: t.color, fontSize: "8px", cursor: "pointer", fontFamily: "'Courier New', monospace" }}>
                  USE
                </button>
              </div>
            ))}

            {/* Negative Prompt */}
            <div style={{ marginTop: "14px", background: "#0d0d1a", border: "1px solid #ff000020", borderRadius: "6px", padding: "12px" }}>
              <div style={{ fontSize: "9px", color: "#ff6b35", letterSpacing: "2px", marginBottom: "6px" }}>NEGATIVE PROMPT — ENTROPY NULLIFIER</div>
              <div style={{ fontSize: "9px", color: "#666", lineHeight: "1.6" }}>{NEGATIVE_PROMPT}</div>
              <button onClick={() => navigator.clipboard?.writeText(NEGATIVE_PROMPT)}
                style={{ marginTop: "8px", padding: "5px 12px", background: "transparent", border: "1px solid #ff6b3540", borderRadius: "3px", color: "#ff6b35", fontSize: "8px", cursor: "pointer", fontFamily: "'Courier New', monospace" }}>
                COPY
              </button>
            </div>
          </div>
        )}

        {/* ── DISCIPLINE TAB ── */}
        {activeTab === "DISCIPLINE" && (
          <div style={{ padding: "16px" }}>
            <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "14px" }}>
              ITERATION DISCIPLINE PROTOCOL
            </div>
            {[
              { rule: "LOCK FIRST", desc: "Lock camera, lighting, and composition for 5 runs before changing anything.", color: "#ffd700" },
              { rule: "ONE VARIABLE", desc: "Change ONLY ONE variable per iteration run. Style OR camera OR mood — never all at once.", color: "#00ffcc" },
              { rule: "SEED CONTROL", desc: "Save seeds of successful renders. Reuse seed with slight prompt variation to evolve, not restart.", color: "#9f7aea" },
              { rule: "NEGATIVE ALWAYS", desc: "Always include the Entropy Nullifier (negative prompt). Never generate without it.", color: "#ff6b35" },
              { rule: "STYLE COHERENCE", desc: "Pick one aesthetic style and run 10 generations before switching. Identity comes from consistency.", color: "#48bb78" },
              { rule: "ENHANCE=TRUE", desc: "Pollinations enhance=true is always active. This upscales and sharpens automatically.", color: "#4da6ff" }
            ].map(r => (
              <div key={r.rule} style={{ marginBottom: "10px", background: "#0d0d1a", border: `1px solid ${r.color}30`, borderLeft: `3px solid ${r.color}`, borderRadius: "4px", padding: "12px" }}>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: r.color, marginBottom: "4px" }}>{r.rule}</div>
                <div style={{ fontSize: "10px", color: "#888", lineHeight: "1.5" }}>{r.desc}</div>
              </div>
            ))}
            <div style={{ marginTop: "14px", padding: "12px", background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.15)", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "#ffd700", fontStyle: "italic" }}>
                "ControlNet discipline · Tool-chain workflow · LoRA consistency.<br/>Digestible. Repeatable. Beautiful."
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
