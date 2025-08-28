import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { TranslationService } from './services/translation.service';

interface Language {
  code: string;
  name: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private translationService = inject(TranslationService);

  readonly MAX_CHARS = 1000;
  
  sourceText = signal('');
  translatedText = signal('');
  sourceLanguage = signal('auto');
  targetLanguage = signal('en');
  isLoading = signal(false);
  error = signal<string | null>(null);
  copied = signal(false);
  selectedProvider = signal<'deepl' | 'google'>('deepl');

  charCountColorClass = computed(() => {
    const length = this.sourceText().length;
    if (length >= this.MAX_CHARS) {
      return 'text-red-400 font-semibold';
    }
    if (length > this.MAX_CHARS * 0.9) {
      return 'text-amber-400';
    }
    return 'text-slate-500';
  });

  textareaBorderClass = computed(() => {
     return this.sourceText().length >= this.MAX_CHARS
      ? 'border-red-500/80 focus:ring-red-500'
      : 'border-slate-700 focus:ring-indigo-500';
  });

  languages: Language[] = [
    { code: 'auto', name: 'Auto-detect' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'nl', name: 'Dutch' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'tr', name: 'Turkish' },
    { code: 'pl', name: 'Polish' }
  ];

  updateSourceText(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    if (value.length <= this.MAX_CHARS) {
      this.sourceText.set(value);
    } else {
        const truncatedValue = value.substring(0, this.MAX_CHARS);
        (event.target as HTMLTextAreaElement).value = truncatedValue;
        this.sourceText.set(truncatedValue);
    }
  }

  async translateText(): Promise<void> {
    if (!this.sourceText().trim() || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.translatedText.set('');
    this.copied.set(false);

    try {
      const result = await this.translationService.translate(
        this.sourceText(),
        this.sourceLanguage(),
        this.targetLanguage(),
        this.selectedProvider()
      );
      this.translatedText.set(result);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  swapLanguages(): void {
    if (this.sourceLanguage() === 'auto') return;

    const currentSource = this.sourceLanguage();
    const currentTarget = this.targetLanguage();
    
    this.sourceLanguage.set(currentTarget);
    this.targetLanguage.set(currentSource);

    if (this.translatedText()) {
      const currentSourceText = this.sourceText();
      this.sourceText.set(this.translatedText());
      this.translatedText.set(currentSourceText);
    }
  }

  copyToClipboard(): void {
    if (!this.translatedText()) return;

    navigator.clipboard.writeText(this.translatedText())
      .then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      })
      .catch(err => console.error('Failed to copy text: ', err));
  }
  
  setSourceLanguage(event: Event): void {
    this.sourceLanguage.set((event.target as HTMLSelectElement).value);
  }
  
  setTargetLanguage(event: Event): void {
    this.targetLanguage.set((event.target as HTMLSelectElement).value);
  }
}