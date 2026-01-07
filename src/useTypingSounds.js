import { useEffect, useRef } from "react";

// Preload audio files for switches
const soundFiles = {
  "gateron-ks-3-milky-yellow-pro": [
    "/sounds/gateron-ks-3-milky-yellow-pro-1.mp3",
    "/sounds/gateron-ks-3-milky-yellow-pro-2.mp3",
    "/sounds/gateron-ks-3-milky-yellow-pro-3.mp3",
  ],
  "cherry-mx2a-black": [
    "/sounds/cherry-mx2a-black-1.mp3",
    "/sounds/cherry-mx2a-black-2.mp3",
    "/sounds/cherry-mx2a-black-3.mp3",
  ],
  "roller-switches": [
    "/sounds/roller-switches-1.mp3",
    "/sounds/roller-switches-2.mp3",
    "/sounds/roller-switches-3.mp3",
  ],
  "hmx-switches": [
    "/sounds/hmx-switches-1.mp3",
    "/sounds/hmx-switches-2.mp3",
    "/sounds/hmx-switches-3.mp3",
  ],
  "akko-purple": [
    "/sounds/akko-purple-1.mp3",
    "/sounds/akko-purple-2.mp3",
    "/sounds/akko-purple-3.mp3",
  ],
  "juggle-v2": [
    "/sounds/juggle-v2-1.mp3",
    "/sounds/juggle-v2-2.mp3",
    "/sounds/juggle-v2-3.mp3",
  ],
  "nimbus-v3": [
    "/sounds/nimbus-v3-1.mp3",
    "/sounds/nimbus-v3-2.mp3",
    "/sounds/nimbus-v3-3.mp3",
  ],
  "graywood-v3": [
    "/sounds/graywood-v3-1.mp3",
    "/sounds/graywood-v3-2.mp3",
    "/sounds/graywood-v3-3.mp3",
  ],
  "baby-kangaroo": [
    "/sounds/baby-kangaroo-1.mp3",
    "/sounds/baby-kangaroo-2.mp3",
    "/sounds/baby-kangaroo-3.mp3",
  ],
  "baby-raccoon": [
    "/sounds/baby-raccoon-1.mp3",
    "/sounds/baby-raccoon-2.mp3",
    "/sounds/baby-raccoon-3.mp3",
  ],
  "gateron-luciola": [
    "/sounds/gateron-luciola-1.mp3",
    "/sounds/gateron-luciola-2.mp3",
    "/sounds/gateron-luciola-3.mp3",
  ],
  "gateron-beer-9-novelkeys-creamy": [
    "/sounds/gateron-beer-9-creamy-1.mp3",
    "/sounds/gateron-beer-9-creamy-2.mp3",
    "/sounds/gateron-beer-9-creamy-3.mp3",
  ],
  "ws-morandi": [
    "/sounds/ws-morandi-1.mp3",
    "/sounds/ws-morandi-2.mp3",
    "/sounds/ws-morandi-3.mp3",
  ],
  "vertex-v1": [
    "/sounds/vertex-v1-1.mp3",
    "/sounds/vertex-v1-2.mp3",
    "/sounds/vertex-v1-3.mp3",
  ],
  "crystal-ice": [
    "/sounds/crystal-ice-1.mp3",
    "/sounds/crystal-ice-2.mp3",
    "/sounds/crystal-ice-3.mp3",
  ],
  "ink-black": [
    "/sounds/ink-black-1.mp3",
    "/sounds/ink-black-2.mp3",
    "/sounds/ink-black-3.mp3",
  ],
  "alpacas": [
    "/sounds/alpacas-1.mp3",
    "/sounds/alpacas-2.mp3",
    "/sounds/alpacas-3.mp3",
  ],
  "holy-boba-u4t": [
    "/sounds/holy-boba-u4t-1.mp3",
    "/sounds/holy-boba-u4t-2.mp3",
    "/sounds/holy-boba-u4t-3.mp3",
  ],
  "durock-linear": [
    "/sounds/durock-linear-1.mp3",
    "/sounds/durock-linear-2.mp3",
    "/sounds/durock-linear-3.mp3",
  ],
  "nuphy-mint": [
    "/sounds/nuphy-mint-1.mp3",
    "/sounds/nuphy-mint-2.mp3",
    "/sounds/nuphy-mint-3.mp3",
  ],
  "akko-cs-pink": [
    "/sounds/akko-cs-pink-1.mp3",
    "/sounds/akko-cs-pink-2.mp3",
    "/sounds/akko-cs-pink-3.mp3",
  ],
};

// Generate audio elements for each sound
const createAudioPool = (sounds, poolSize = 5) => {
  const pool = [];
  for (let i = 0; i < poolSize; i++) {
    sounds.forEach((sound) => {
      const audio = new Audio(sound);
      audio.volume = 0.3;
      pool.push(audio);
    });
  }
  return pool;
};

// Use Web Audio API to generate simple sounds if files don't exist
let audioContextInstance = null;

const getAudioContext = () => {
  if (!audioContextInstance) {
    audioContextInstance = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (required for some browsers)
  if (audioContextInstance.state === 'suspended') {
    audioContextInstance.resume();
  }
  return audioContextInstance;
};

const generateSound = (type) => {
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;
    
    // Create multiple oscillators for more realistic mechanical keyboard sounds
    const createKeySound = (freq, type, duration, gain, clickFreq = null) => {
      const osc = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const clickOsc = clickFreq ? audioContext.createOscillator() : null;
      const clickGain = clickFreq ? audioContext.createGain() : null;

      osc.type = type;
      osc.frequency.value = freq;
      gainNode.gain.setValueAtTime(gain, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      osc.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (clickOsc && clickGain) {
        clickOsc.type = "square";
        clickOsc.frequency.value = clickFreq;
        clickGain.gain.setValueAtTime(gain * 0.6, now);
        clickGain.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.3);
        clickOsc.connect(clickGain);
        clickGain.connect(audioContext.destination);
        clickOsc.start(now);
        clickOsc.stop(now + duration * 0.3);
      }
      
      osc.start(now);
      osc.stop(now + duration);
    };

    switch (type) {
      case "gateron-ks-3-milky-yellow-pro":
        // Linear, smooth, creamy
        createKeySound(160 + Math.random() * 30, "sine", 0.09, 0.09);
        break;
      case "cherry-mx2a-black":
        // Linear, heavy, deep
        createKeySound(110 + Math.random() * 25, "sine", 0.16, 0.13);
        break;
      case "roller-switches":
        // Unique smooth rolling sound
        createKeySound(140 + Math.random() * 35, "sine", 0.11, 0.10);
        break;
      case "hmx-switches":
        // Linear, smooth
        createKeySound(155 + Math.random() * 30, "sine", 0.08, 0.08);
        break;
      case "akko-purple":
        // Tactile, medium bump
        createKeySound(190 + Math.random() * 35, "sine", 0.10, 0.10, 450 + Math.random() * 80);
        break;
      case "juggle-v2":
        // Tactile, satisfying
        createKeySound(200 + Math.random() * 40, "sine", 0.11, 0.10, 500 + Math.random() * 100);
        break;
      case "nimbus-v3":
        // Linear, light and airy
        createKeySound(170 + Math.random() * 30, "sine", 0.08, 0.08);
        break;
      case "graywood-v3":
        // Tactile, woody
        createKeySound(175 + Math.random() * 35, "sine", 0.12, 0.11, 480 + Math.random() * 90);
        break;
      case "baby-kangaroo":
        // Tactile, light and bouncy
        createKeySound(185 + Math.random() * 30, "sine", 0.09, 0.09, 520 + Math.random() * 80);
        break;
      case "baby-raccoon":
        // Tactile, light
        createKeySound(180 + Math.random() * 32, "sine", 0.09, 0.09, 510 + Math.random() * 85);
        break;
      case "gateron-luciola":
        // Linear, smooth, glowing
        createKeySound(165 + Math.random() * 28, "sine", 0.09, 0.09);
        break;
      case "gateron-beer-9-novelkeys-creamy":
        // Linear, creamy and smooth
        createKeySound(158 + Math.random() * 30, "sine", 0.10, 0.09);
        break;
      case "ws-morandi":
        // Linear, muted and smooth
        createKeySound(150 + Math.random() * 28, "sine", 0.09, 0.08);
        break;
      case "vertex-v1":
        // Tactile, sharp
        createKeySound(195 + Math.random() * 38, "sine", 0.11, 0.10, 550 + Math.random() * 100);
        break;
      case "crystal-ice":
        // Linear, crisp and clear
        createKeySound(175 + Math.random() * 30, "sine", 0.08, 0.08);
        break;
      case "ink-black":
        // Linear, deep and smooth
        createKeySound(130 + Math.random() * 30, "sine", 0.12, 0.11);
        break;
      case "alpacas":
        // Linear, smooth and buttery
        createKeySound(162 + Math.random() * 28, "sine", 0.09, 0.09);
        break;
      case "holy-boba-u4t":
        // Tactile, thocky and deep
        createKeySound(145 + Math.random() * 30, "sine", 0.13, 0.12, 400 + Math.random() * 80);
        break;
      case "durock-linear":
        // Linear, smooth
        createKeySound(160 + Math.random() * 30, "sine", 0.09, 0.09);
        break;
      case "nuphy-mint":
        // Linear, light and fresh
        createKeySound(168 + Math.random() * 28, "sine", 0.08, 0.08);
        break;
      case "akko-cs-pink":
        // Tactile, light and pleasant
        createKeySound(188 + Math.random() * 32, "sine", 0.10, 0.09, 490 + Math.random() * 90);
        break;
      default:
        // Default to Gateron KS-3 Milky Yellow Pro if unknown type
        createKeySound(160 + Math.random() * 30, "sine", 0.09, 0.09);
    }
  } catch (e) {
    // Silently fail if audio context can't be created
    console.debug("Audio context error:", e);
  }
};

export function useTypingSounds(enabled, soundType = "gateron-ks-3-milky-yellow-pro", volume = 0.3) {
  const audioPoolsRef = useRef({});
  const lastPlayTimeRef = useRef(0);
  const audioContextInitializedRef = useRef(false);
  const throttleDelay = 50; // Minimum time between sounds (ms)

  useEffect(() => {
    if (!enabled) return;

    // Initialize audio context on first user interaction
    const initAudioContext = () => {
      if (!audioContextInitializedRef.current) {
        try {
          getAudioContext();
          audioContextInitializedRef.current = true;
        } catch (e) {
          console.debug("Audio context initialization failed:", e);
        }
      }
    };

    // Try to load audio files, fallback to generated sounds
    const loadSounds = async () => {
      const pools = {};
      for (const [type, files] of Object.entries(soundFiles)) {
        try {
          // Try to load first file to check if they exist
          const testAudio = new Audio(files[0]);
          await new Promise((resolve, reject) => {
            testAudio.oncanplay = resolve;
            testAudio.onerror = reject;
            testAudio.load();
          });
          pools[type] = createAudioPool(files);
        } catch (e) {
          // Files don't exist, will use generated sounds
          pools[type] = null;
        }
      }
      audioPoolsRef.current = pools;
    };

    // Initialize on any user interaction
    const handleInteraction = () => {
      initAudioContext();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
    
    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });
    
    loadSounds();

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [enabled]);

  const playSound = () => {
    if (!enabled) return;

    // Initialize audio context if needed
    if (!audioContextInitializedRef.current) {
      try {
        getAudioContext();
        audioContextInitializedRef.current = true;
      } catch (e) {
        return; // Can't play sounds yet
      }
    }

    const now = Date.now();
    if (now - lastPlayTimeRef.current < throttleDelay) return;
    lastPlayTimeRef.current = now;

    const pool = audioPoolsRef.current[soundType];
    
    if (pool && pool.length > 0) {
      // Use audio files if available
      const availableAudio = pool.find((audio) => audio.ended || audio.currentTime === 0);
      if (availableAudio) {
        availableAudio.currentTime = 0;
        availableAudio.volume = volume;
        availableAudio.play().catch(() => {
          // If play fails, fallback to generated sound
          generateSound(soundType);
        });
      } else {
        // All audio elements are playing, use generated sound
        generateSound(soundType);
      }
    } else {
      // No audio files, use generated sound
      generateSound(soundType);
    }
  };

  return { playSound };
}

