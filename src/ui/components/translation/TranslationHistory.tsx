import React, { useState, useEffect } from 'react';
import './TranslationHistory.css';

interface TranslationItem {
  sourceText: string;
  translatedText: string;
  elementId: string;
  elementType: string;
  position?: { x: number; y: number };
  style?: Record<string, any>;
}

interface TranslationRecord {
  id: string;
  timestamp: number;
  parentNode: {
    id: string;
    name: string;
    type: string;
  };
  translations: TranslationItem[];
}

export const TranslationHistoryView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [records, setRecords] = useState<TranslationRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    parent.postMessage({ pluginMessage: { type: 'get-history' } }, '*');
  };

  const handleSearch = () => {
    parent.postMessage({ 
      pluginMessage: { 
        type: 'search-history',
        query: searchQuery 
      }
    }, '*');
  };

  const clearHistory = () => {
    if (window.confirm('确定要清空所有历史记录吗？')) {
      parent.postMessage({ pluginMessage: { type: 'clear-history' } }, '*');
    }
  };

  const regenerateTranslation = (record: TranslationRecord) => {
    parent.postMessage({ 
      pluginMessage: { 
        type: 'regenerate-translation',
        record 
      }
    }, '*');
  };

  const regenerateSelected = () => {
    const selectedItems = records.filter(record => selectedRecords.has(record.id));
    if (selectedItems.length === 0) {
      alert('请先选择要重新生成的记录');
      return;
    }

    selectedItems.forEach(record => {
      regenerateTranslation(record);
    });
  };

  const toggleRecordSelection = (recordId: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRecords(newSelected);
  };

  const toggleRecordExpansion = (recordId: string) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedRecords(newExpanded);
  };

  const selectAll = () => {
    const newSelected = new Set(records.map(record => record.id));
    setSelectedRecords(newSelected);
  };

  const deselectAll = () => {
    setSelectedRecords(new Set());
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, records: historyRecords } = event.data.pluginMessage || {};
      
      if (type === 'history-loaded' || type === 'history-searched') {
        const validRecords = (historyRecords || []).filter((record: any) => {
          return record && 
                 record.id && 
                 record.timestamp && 
                 record.parentNode && 
                 record.parentNode.id && 
                 record.parentNode.name && 
                 record.parentNode.type &&
                 Array.isArray(record.translations);
        });
        
        console.log('[Figma Translator] Validated records:', validRecords);
        setRecords(validRecords);
        setLoading(false);
      } else if (type === 'history-cleared') {
        setRecords([]);
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="translation-history">
      <div className="history-header">
        <h2>翻译历史记录</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="搜索历史记录..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>搜索</button>
        <button className="clear-button" onClick={clearHistory}>清空历史</button>
      </div>

      <div className="history-actions">
        <button onClick={selectAll}>全选</button>
        <button onClick={deselectAll}>取消全选</button>
        <button 
          onClick={regenerateSelected}
          disabled={selectedRecords.size === 0}
        >
          重新生成选中项
        </button>
      </div>

      <div className="history-list">
        {loading ? (
          <div className="loading">
            <div className="loading-icon">⌛</div>
            <p>加载中...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <p>暂无翻译历史记录</p>
          </div>
        ) : (
          records.map(record => {
            if (!record || !record.parentNode) {
              return null;
            }
            
            return (
              <div 
                key={record.id} 
                className={`history-item ${selectedRecords.has(record.id) ? 'selected' : ''}`}
              >
                <div 
                  className="history-item-header"
                  onClick={() => toggleRecordSelection(record.id)}
                >
                  <div className="header-left">
                    <button
                      className={`expand-button ${expandedRecords.has(record.id) ? 'expanded' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRecordExpansion(record.id);
                      }}
                    >
                      {expandedRecords.has(record.id) ? '▼' : '▶'}
                    </button>
                    <span className="element-type">{record.parentNode.type}</span>
                    <span className="element-name">{record.parentNode.name}</span>
                    <span className="translation-count">
                      ({record.translations.length} 个文本)
                    </span>
                  </div>
                  <div className="header-right">
                    <span className="timestamp">{formatDate(record.timestamp)}</span>
                    <button 
                      className="regenerate-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        regenerateTranslation(record);
                      }}
                    >
                      重新生成
                    </button>
                  </div>
                </div>
                {expandedRecords.has(record.id) && (
                  <div className="translations-list">
                    {record.translations.map((item, index) => (
                      <div key={item.elementId} className="translation-item">
                        <div className="translation-item-header">
                          <span className="item-number">#{index + 1}</span>
                          <span className="item-type">{item.elementType}</span>
                        </div>
                        <div className="translation-content">
                          <div className="source-text">{item.sourceText}</div>
                          <span className="arrow">→</span>
                          <div className="translated-text">{item.translatedText}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}; 