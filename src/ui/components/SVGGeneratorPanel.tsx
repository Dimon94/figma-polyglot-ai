import React, { useState } from 'react';
import { SVGGenerationOptions } from '../../main/service/svg/SVGGenerationService';

interface SVGGeneratorPanelProps {
  onGenerate: (options: SVGGenerationOptions) => Promise<void>;
  isGenerating: boolean;
}

export const SVGGeneratorPanel: React.FC<SVGGeneratorPanelProps> = ({
  onGenerate,
  isGenerating,
}) => {
  const [description, setDescription] = useState('');
  const [width, setWidth] = useState<number | undefined>();
  const [height, setHeight] = useState<number | undefined>();
  const [style, setStyle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const options: SVGGenerationOptions = {
      description,
      width,
      height,
      style,
    };

    await onGenerate(options);
  };

  return (
    <div className="svg-generator-panel">
      <h2>SVG生成器</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="description">描述</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请描述你想要生成的SVG图像..."
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="width">宽度</label>
            <input
              type="number"
              id="width"
              value={width || ''}
              onChange={(e) => setWidth(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="自动"
            />
          </div>

          <div className="form-group">
            <label htmlFor="height">高度</label>
            <input
              type="number"
              id="height"
              value={height || ''}
              onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="自动"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="style">样式</label>
          <input
            type="text"
            id="style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="可选的样式描述，例如：modern, colorful, minimal 等"
          />
        </div>

        <button
          type="submit"
          disabled={isGenerating || !description.trim()}
          className={isGenerating ? 'loading' : ''}
        >
          {isGenerating ? '生成中...' : '生成SVG'}
        </button>
      </form>
    </div>
  );
}; 