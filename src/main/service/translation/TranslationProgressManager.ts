interface TranslationTask {
  id: string;
  text: string;
  status: 'pending' | 'translating' | 'completed' | 'failed';
  error?: string;
}

interface TranslationProgress {
  total: number;
  completed: number;
  failed: number;
  status: 'idle' | 'translating' | 'completed' | 'error';
  errorMessage?: string;
}

export class TranslationProgressManager {
  private tasks: Map<string, TranslationTask> = new Map();
  private progressCallback?: (progress: TranslationProgress) => void;

  initializeTasks(texts: string[]): void {
    this.tasks.clear();
    texts.forEach(text => {
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      this.tasks.set(id, {
        id,
        text,
        status: 'pending'
      });
    });
  }

  setProgressCallback(callback: (progress: TranslationProgress) => void): void {
    this.progressCallback = callback;
  }

  startTranslation(): void {
    this.tasks.forEach(task => {
      task.status = 'translating';
    });
    this.notifyProgress();
  }

  updateProgress(taskId: string, success: boolean, error?: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = success ? 'completed' : 'failed';
      task.error = error;
      this.notifyProgress();
    }
  }

  getProgress(): TranslationProgress {
    let completed = 0;
    let failed = 0;
    let hasError = false;
    let errorMessage = '';

    this.tasks.forEach(task => {
      if (task.status === 'completed') completed++;
      if (task.status === 'failed') {
        failed++;
        hasError = true;
        errorMessage = task.error || '翻译失败';
      }
    });

    const total = this.tasks.size;
    const allCompleted = completed + failed === total;

    return {
      total,
      completed,
      failed,
      status: allCompleted ? (hasError ? 'error' : 'completed') : 'translating',
      errorMessage: hasError ? errorMessage : undefined
    };
  }

  reset(): void {
    this.tasks.clear();
    this.notifyProgress();
  }

  isTranslationComplete(): boolean {
    return Array.from(this.tasks.values()).every(
      task => task.status === 'completed' || task.status === 'failed'
    );
  }

  private notifyProgress(): void {
    if (this.progressCallback) {
      this.progressCallback(this.getProgress());
    }
  }
} 