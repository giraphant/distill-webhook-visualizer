#!/usr/bin/env python3
"""
Generate different alert sounds for different priority levels.
"""
import numpy as np
import wave
import struct

def generate_beep(frequency, duration, sample_rate=44100, volume=0.5):
    """Generate a simple beep tone."""
    t = np.linspace(0, duration, int(sample_rate * duration))
    wave_data = volume * np.sin(2 * np.pi * frequency * t)
    return wave_data

def apply_envelope(wave_data, attack=0.01, decay=0.01, sustain=0.7, release=0.1, sample_rate=44100):
    """Apply ADSR envelope to make sound more natural."""
    length = len(wave_data)
    envelope = np.ones(length)

    attack_samples = int(attack * sample_rate)
    decay_samples = int(decay * sample_rate)
    release_samples = int(release * sample_rate)

    # Attack
    if attack_samples > 0:
        envelope[:attack_samples] = np.linspace(0, 1, attack_samples)

    # Decay
    if decay_samples > 0:
        decay_end = attack_samples + decay_samples
        envelope[attack_samples:decay_end] = np.linspace(1, sustain, decay_samples)

    # Sustain (already set to sustain level via ones)
    sustain_start = attack_samples + decay_samples
    sustain_end = length - release_samples
    envelope[sustain_start:sustain_end] = sustain

    # Release
    if release_samples > 0:
        envelope[sustain_end:] = np.linspace(sustain, 0, release_samples)

    return wave_data * envelope

def save_wav(filename, wave_data, sample_rate=44100):
    """Save wave data to WAV file."""
    # Convert to 16-bit PCM
    wave_data = np.clip(wave_data, -1, 1)
    wave_data = (wave_data * 32767).astype(np.int16)

    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(wave_data.tobytes())

def generate_critical_alert(filename):
    """
    Critical alert: Urgent, attention-grabbing
    - Triple beep pattern with high frequency
    - Fast tempo
    - Loud
    """
    sample_rate = 44100
    beeps = []

    # Three rapid beeps at high frequency
    for i in range(3):
        beep = generate_beep(1200, 0.15, sample_rate, volume=0.8)
        beep = apply_envelope(beep, attack=0.005, decay=0.01, sustain=0.9, release=0.05, sample_rate=sample_rate)
        beeps.append(beep)

        # Short pause between beeps
        if i < 2:
            pause = np.zeros(int(0.1 * sample_rate))
            beeps.append(pause)

    combined = np.concatenate(beeps)
    save_wav(filename, combined, sample_rate)
    print(f"Generated {filename} - Critical alert (triple beep, 1200Hz)")

def generate_high_alert(filename):
    """
    High alert: Important but not critical
    - Double beep pattern
    - Medium-high frequency
    - Moderate volume
    """
    sample_rate = 44100
    beeps = []

    # Two beeps at medium-high frequency
    for i in range(2):
        beep = generate_beep(900, 0.2, sample_rate, volume=0.6)
        beep = apply_envelope(beep, attack=0.01, decay=0.02, sustain=0.8, release=0.08, sample_rate=sample_rate)
        beeps.append(beep)

        # Short pause between beeps
        if i < 1:
            pause = np.zeros(int(0.15 * sample_rate))
            beeps.append(pause)

    combined = np.concatenate(beeps)
    save_wav(filename, combined, sample_rate)
    print(f"Generated {filename} - High alert (double beep, 900Hz)")

def generate_medium_alert(filename):
    """
    Medium alert: Standard notification
    - Single rising tone
    - Medium frequency
    - Gentle
    """
    sample_rate = 44100
    duration = 0.4

    # Rising tone from 600Hz to 800Hz
    t = np.linspace(0, duration, int(sample_rate * duration))
    frequency = np.linspace(600, 800, len(t))
    phase = 2 * np.pi * np.cumsum(frequency) / sample_rate
    wave_data = 0.4 * np.sin(phase)

    wave_data = apply_envelope(wave_data, attack=0.02, decay=0.05, sustain=0.7, release=0.15, sample_rate=sample_rate)
    save_wav(filename, wave_data, sample_rate)
    print(f"Generated {filename} - Medium alert (rising tone, 600-800Hz)")

def generate_low_alert(filename):
    """
    Low alert: Subtle notification
    - Single soft beep
    - Low frequency
    - Very gentle
    """
    sample_rate = 44100
    duration = 0.3

    beep = generate_beep(500, duration, sample_rate, volume=0.2)
    beep = apply_envelope(beep, attack=0.03, decay=0.05, sustain=0.6, release=0.2, sample_rate=sample_rate)

    save_wav(filename, beep, sample_rate)
    print(f"Generated {filename} - Low alert (soft beep, 500Hz)")

if __name__ == '__main__':
    print("Generating alert sounds...")
    generate_critical_alert('static/sounds/alert-critical.wav')
    generate_high_alert('static/sounds/alert-high.wav')
    generate_medium_alert('static/sounds/alert-medium.wav')
    generate_low_alert('static/sounds/alert-low.wav')
    print("Done!")
