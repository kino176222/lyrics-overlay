/**
 * AI歌詞タイミング認識モジュール
 * Web Audio APIを使用して音声解析を行い、歌詞のタイミングを自動検出
 */

class AITimingRecognizer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.audioBuffer = null;
        this.isAnalyzing = false;
    }

    /**
     * 音声ファイルを解析用に初期化
     */
    async initialize(audioFile) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        
        // ファイルを読み込み
        const arrayBuffer = await audioFile.arrayBuffer();
        this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        return true;
    }

    /**
     * 歌詞のタイミングを自動認識
     * @param {Array} lyricsLines - 歌詞の行配列
     * @returns {Array} タイミング情報付きの歌詞データ
     */
    async recognizeTiming(lyricsLines) {
        if (!this.audioBuffer) {
            throw new Error('音声ファイルが初期化されていません');
        }

        // 音声の特徴を解析
        const features = await this.analyzeAudioFeatures();
        
        // 歌詞の行数に基づいてタイミングを推定
        const duration = this.audioBuffer.duration;
        const lineCount = lyricsLines.length;
        
        // ボーカル検出ポイントを取得
        const vocalPoints = this.detectVocalPoints(features);
        
        // 歌詞とボーカルポイントをマッチング
        const timingData = this.matchLyricsToVocals(lyricsLines, vocalPoints, duration);
        
        return timingData;
    }

    /**
     * 音声特徴を解析
     */
    async analyzeAudioFeatures() {
        const sampleRate = this.audioBuffer.sampleRate;
        const channelData = this.audioBuffer.getChannelData(0); // モノラル化
        const windowSize = 2048;
        const hopSize = 512;
        
        const features = {
            energy: [],
            zeroCrossingRate: [],
            spectralCentroid: [],
            timestamps: []
        };

        // スライディングウィンドウで解析
        for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
            const window = channelData.slice(i, i + windowSize);
            
            // エネルギー計算
            const energy = this.calculateEnergy(window);
            features.energy.push(energy);
            
            // ゼロ交差率（音声/無音の判定に使用）
            const zcr = this.calculateZeroCrossingRate(window);
            features.zeroCrossingRate.push(zcr);
            
            // スペクトル重心（音の明るさ）
            const centroid = this.calculateSpectralCentroid(window);
            features.spectralCentroid.push(centroid);
            
            // タイムスタンプ
            features.timestamps.push(i / sampleRate);
        }

        return features;
    }

    /**
     * エネルギー計算
     */
    calculateEnergy(window) {
        return window.reduce((sum, sample) => sum + sample * sample, 0) / window.length;
    }

    /**
     * ゼロ交差率計算
     */
    calculateZeroCrossingRate(window) {
        let crossings = 0;
        for (let i = 1; i < window.length; i++) {
            if ((window[i] >= 0) !== (window[i - 1] >= 0)) {
                crossings++;
            }
        }
        return crossings / window.length;
    }

    /**
     * スペクトル重心計算（簡易版）
     */
    calculateSpectralCentroid(window) {
        // FFTを使用した本格的な実装は複雑なため、簡易版
        const fft = this.simpleFFT(window);
        let weightedSum = 0;
        let magnitudeSum = 0;
        
        for (let i = 0; i < fft.length / 2; i++) {
            const magnitude = Math.sqrt(fft[i] * fft[i] + fft[i + fft.length / 2] * fft[i + fft.length / 2]);
            weightedSum += i * magnitude;
            magnitudeSum += magnitude;
        }
        
        return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    }

    /**
     * 簡易FFT（実装は省略、実際にはWeb Audio APIのAnalyserNodeを使用）
     */
    simpleFFT(window) {
        // 簡易的な実装（実際の使用時はより高度なFFTライブラリを使用）
        return window;
    }

    /**
     * ボーカルポイントを検出
     */
    detectVocalPoints(features) {
        const vocalPoints = [];
        const energyThreshold = this.calculateThreshold(features.energy);
        const zcrThreshold = 0.1; // 音声の典型的なZCR範囲
        
        let inVocal = false;
        let startTime = 0;
        
        for (let i = 0; i < features.energy.length; i++) {
            const isVocal = features.energy[i] > energyThreshold && 
                           features.zeroCrossingRate[i] > zcrThreshold;
            
            if (isVocal && !inVocal) {
                // ボーカル開始
                startTime = features.timestamps[i];
                inVocal = true;
            } else if (!isVocal && inVocal) {
                // ボーカル終了
                vocalPoints.push({
                    start: startTime,
                    end: features.timestamps[i]
                });
                inVocal = false;
            }
        }
        
        // 最後のセグメントを追加
        if (inVocal) {
            vocalPoints.push({
                start: startTime,
                end: features.timestamps[features.timestamps.length - 1]
            });
        }
        
        return vocalPoints;
    }

    /**
     * 動的閾値計算
     */
    calculateThreshold(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const percentile = Math.floor(sorted.length * 0.3); // 下位30%を無音とみなす
        return sorted[percentile] * 1.5; // マージンを追加
    }

    /**
     * 歌詞とボーカルポイントをマッチング
     */
    matchLyricsToVocals(lyricsLines, vocalPoints, totalDuration) {
        const result = [];
        
        if (vocalPoints.length === 0) {
            // ボーカルが検出されない場合は均等配分
            const interval = totalDuration / lyricsLines.length;
            for (let i = 0; i < lyricsLines.length; i++) {
                result.push({
                    text: lyricsLines[i],
                    startTime: i * interval,
                    endTime: (i + 1) * interval - 0.2, // 少し短めに
                    confidence: 0.3 // 低い信頼度
                });
            }
        } else {
            // ボーカルポイントに歌詞を割り当て
            const linesPerVocal = Math.ceil(lyricsLines.length / vocalPoints.length);
            
            for (let i = 0; i < lyricsLines.length; i++) {
                const vocalIndex = Math.floor(i / linesPerVocal);
                const vocal = vocalPoints[Math.min(vocalIndex, vocalPoints.length - 1)];
                
                // ボーカル区間内で均等配分
                const linesInVocal = Math.min(linesPerVocal, lyricsLines.length - vocalIndex * linesPerVocal);
                const lineIndex = i % linesPerVocal;
                const lineDuration = (vocal.end - vocal.start) / linesInVocal;
                
                result.push({
                    text: lyricsLines[i],
                    startTime: vocal.start + lineIndex * lineDuration,
                    endTime: vocal.start + (lineIndex + 1) * lineDuration - 0.1,
                    confidence: 0.7 // 中程度の信頼度
                });
            }
        }
        
        return result;
    }

    /**
     * タイミングの微調整（ユーザー入力を反映）
     */
    adjustTiming(timingData, adjustments) {
        return timingData.map((item, index) => {
            if (adjustments[index]) {
                return {
                    ...item,
                    startTime: adjustments[index].startTime || item.startTime,
                    endTime: adjustments[index].endTime || item.endTime,
                    confidence: 1.0 // ユーザー調整済み
                };
            }
            return item;
        });
    }

    /**
     * ビート検出（リズムに合わせた調整用）
     */
    async detectBeats() {
        // オンセット検出アルゴリズムの簡易実装
        const features = await this.analyzeAudioFeatures();
        const energyDiff = [];
        
        for (let i = 1; i < features.energy.length; i++) {
            energyDiff.push(features.energy[i] - features.energy[i - 1]);
        }
        
        // ピーク検出
        const peaks = [];
        const threshold = this.calculateThreshold(energyDiff.filter(d => d > 0));
        
        for (let i = 1; i < energyDiff.length - 1; i++) {
            if (energyDiff[i] > threshold &&
                energyDiff[i] > energyDiff[i - 1] &&
                energyDiff[i] > energyDiff[i + 1]) {
                peaks.push(features.timestamps[i]);
            }
        }
        
        return peaks;
    }

    /**
     * タイミングをビートにスナップ
     */
    snapToBeats(timingData, beats) {
        return timingData.map(item => {
            // 最も近いビートを見つける
            const closestBeat = beats.reduce((closest, beat) => {
                const currentDiff = Math.abs(beat - item.startTime);
                const closestDiff = Math.abs(closest - item.startTime);
                return currentDiff < closestDiff ? beat : closest;
            }, beats[0]);
            
            const offset = closestBeat - item.startTime;
            
            return {
                ...item,
                startTime: closestBeat,
                endTime: item.endTime + offset,
                snapped: true
            };
        });
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AITimingRecognizer;
}