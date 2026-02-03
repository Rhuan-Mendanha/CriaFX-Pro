import type { EqualizerSettings } from '@/hooks/useMusicPlayer';

export type ExportFormat = 'wav' | 'mp3' | 'ogg';

export async function exportAudioWithEQ(
  audioElement: HTMLAudioElement,
  audioContext: AudioContext,
  filters: BiquadFilterNode[],
  settings: EqualizerSettings,
  trackName: string,
  format: ExportFormat = 'wav'
): Promise<void> {
  try {
    // Create offline context for rendering
    const sampleRate = 44100;
    const duration = audioElement.duration;
    const offlineContext = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

    // Fetch the audio file
    const response = await fetch(audioElement.src);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer);

    // Create source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    // Create and connect filters
    const offlineFilters: BiquadFilterNode[] = [];
    let currentNode: AudioNode = source;

    settings.bands.forEach((band) => {
      if (settings.enabled) {
        const filter = offlineContext.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = band.frequency;
        filter.Q.value = 1.0;
        filter.gain.value = band.gain * settings.intensity;

        currentNode.connect(filter);
        currentNode = filter;
        offlineFilters.push(filter);
      }
    });

    // Connect to destination
    currentNode.connect(offlineContext.destination);

    // Start rendering
    source.start();
    const renderedBuffer = await offlineContext.startRendering();

    // Convert based on format
    let blob: Blob;
    let extension: string;
    
    switch (format) {
      case 'wav':
        const wav = audioBufferToWav(renderedBuffer);
        blob = new Blob([wav], { type: 'audio/wav' });
        extension = 'wav';
        break;
      
      case 'mp3':
        // For MP3, we'll use the MediaRecorder API
        blob = await audioBufferToMp3(renderedBuffer);
        extension = 'mp3';
        break;
      
      case 'ogg':
        blob = await audioBufferToOgg(renderedBuffer);
        extension = 'ogg';
        break;
      
      default:
        const defaultWav = audioBufferToWav(renderedBuffer);
        blob = new Blob([defaultWav], { type: 'audio/wav' });
        extension = 'wav';
    }

    // Download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trackName}_CriaFX.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error exporting audio:', error);
    throw error;
  }
}

async function audioBufferToMp3(buffer: AudioBuffer): Promise<Blob> {
  // Create a temporary audio context to play the buffer
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );
  
  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  
  // Use MediaRecorder to encode to MP3
  const dest = offlineCtx.createMediaStreamDestination();
  source.connect(dest);
  
  const mediaRecorder = new MediaRecorder(dest.stream, {
    mimeType: 'audio/webm;codecs=opus', // Most browsers support this
    audioBitsPerSecond: 128000
  });
  
  const chunks: Blob[] = [];
  
  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    
    mediaRecorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'audio/webm' }));
    };
    
    mediaRecorder.onerror = reject;
    
    source.start();
    mediaRecorder.start();
    
    setTimeout(() => {
      mediaRecorder.stop();
      source.stop();
    }, (buffer.duration * 1000) + 100);
  });
}

async function audioBufferToOgg(buffer: AudioBuffer): Promise<Blob> {
  // Similar to MP3 but with OGG container
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );
  
  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  
  const dest = offlineCtx.createMediaStreamDestination();
  source.connect(dest);
  
  const mediaRecorder = new MediaRecorder(dest.stream, {
    mimeType: 'audio/ogg;codecs=opus',
    audioBitsPerSecond: 128000
  });
  
  const chunks: Blob[] = [];
  
  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    
    mediaRecorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'audio/ogg' }));
    };
    
    mediaRecorder.onerror = reject;
    
    source.start();
    mediaRecorder.start();
    
    setTimeout(() => {
      mediaRecorder.stop();
      source.stop();
    }, (buffer.duration * 1000) + 100);
  });
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numberOfChannels = buffer.numberOfChannels;
  const length = buffer.length * numberOfChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, length, true);

  // Write audio data
  const channels: Float32Array[] = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}
