/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/main/code.ts":
/*!**************************!*\
  !*** ./src/main/code.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var traverse_1 = __webpack_require__(/*! ./utils/traverse */ "./src/main/utils/traverse.ts");
var translation_1 = __webpack_require__(/*! ./service/translation */ "./src/main/service/translation.ts");
// 默认设置
var DEFAULT_SETTINGS = {
    apiKey: '',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    modelName: 'gpt-3.5-turbo',
    provider: 'openai'
};
// 开启控制台调试日志
var DEBUG = true;
function debug() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    if (DEBUG) {
        console.log.apply(console, __spreadArray(['[Figma Translator]'], args, false));
    }
}
figma.showUI(__html__, { width: 400, height: 500 });
// 更新翻译进度
function updateProgress(percent, message) {
    figma.ui.postMessage({
        type: 'translation-progress',
        progress: percent,
        message: message
    });
}
// 监听来自UI的消息
figma.ui.onmessage = function (msg) { return __awaiter(void 0, void 0, void 0, function () {
    var settings, selectedTextNodes, settings, translatedCount, totalNodes, _i, selectedTextNodes_1, node, progress, clone, translated, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('[Figma Translator] Received message:', msg);
                if (!(msg.type === 'load-settings')) return [3 /*break*/, 2];
                return [4 /*yield*/, figma.clientStorage.getAsync('settings')];
            case 1:
                settings = (_a.sent()) || DEFAULT_SETTINGS;
                console.log('[Figma Translator] Loaded settings:', settings);
                figma.ui.postMessage({ type: 'settings-loaded', settings: settings });
                return [3 /*break*/, 13];
            case 2:
                if (!(msg.type === 'save-settings')) return [3 /*break*/, 4];
                // 保存设置
                return [4 /*yield*/, figma.clientStorage.setAsync('settings', msg.settings)];
            case 3:
                // 保存设置
                _a.sent();
                console.log('[Figma Translator] Settings saved:', msg.settings);
                figma.notify('Settings saved successfully!');
                return [3 /*break*/, 13];
            case 4:
                if (!(msg.type === 'translate')) return [3 /*break*/, 13];
                selectedTextNodes = figma.currentPage.selection.filter(function (node) { return node.type === "TEXT"; });
                if (selectedTextNodes.length === 0) {
                    figma.notify("Please select at least one text layer");
                    return [2 /*return*/];
                }
                return [4 /*yield*/, figma.clientStorage.getAsync('settings')];
            case 5:
                settings = _a.sent();
                console.log('[Figma Translator] Translation settings:', settings);
                if (!settings || !settings.apiKey) {
                    figma.notify("Please configure API settings first");
                    figma.showUI(__html__);
                    return [2 /*return*/];
                }
                _a.label = 6;
            case 6:
                _a.trys.push([6, 12, , 13]);
                translatedCount = 0;
                totalNodes = selectedTextNodes.length;
                // 显示初始进度
                updateProgress(0, "\u51C6\u5907\u7FFB\u8BD1 ".concat(totalNodes, " \u4E2A\u6587\u672C\u56FE\u5C42..."));
                _i = 0, selectedTextNodes_1 = selectedTextNodes;
                _a.label = 7;
            case 7:
                if (!(_i < selectedTextNodes_1.length)) return [3 /*break*/, 11];
                node = selectedTextNodes_1[_i];
                progress = Math.round((translatedCount / totalNodes) * 100);
                updateProgress(progress, "\u6B63\u5728\u7FFB\u8BD1\u7B2C ".concat(translatedCount + 1, "/").concat(totalNodes, " \u4E2A\u6587\u672C\u56FE\u5C42 (").concat(progress, "%)"));
                clone = node.clone();
                clone.x = node.x + node.width + 20;
                clone.y = node.y;
                // 加载字体
                console.log('[Figma Translator] Loading fonts for node:', node.name);
                return [4 /*yield*/, Promise.all(node.getRangeAllFontNames(0, node.characters.length)
                        .map(figma.loadFontAsync))];
            case 8:
                _a.sent();
                console.log('[Figma Translator] Fonts loaded successfully');
                return [4 /*yield*/, (0, translation_1.translateText)(node.characters, settings)];
            case 9:
                translated = _a.sent();
                clone.characters = translated;
                translatedCount++;
                _a.label = 10;
            case 10:
                _i++;
                return [3 /*break*/, 7];
            case 11:
                // 完成翻译，显示100%进度
                updateProgress(100, "\u5DF2\u5B8C\u6210 ".concat(totalNodes, " \u4E2A\u6587\u672C\u56FE\u5C42\u7684\u7FFB\u8BD1\uFF01"));
                // 延迟一会儿再隐藏进度条，让用户能看到完成状态
                setTimeout(function () {
                    figma.ui.postMessage({ type: 'translation-complete' });
                }, 1500);
                figma.notify("\u5DF2\u7FFB\u8BD1 ".concat(translatedCount, " \u4E2A\u6587\u672C\u56FE\u5C42"));
                return [3 /*break*/, 13];
            case 12:
                error_1 = _a.sent();
                console.error('[Figma Translator] Translation failed:', error_1);
                figma.notify('翻译失败: ' + (error_1.message || '未知错误'));
                figma.ui.postMessage({ type: 'translation-complete' });
                return [3 /*break*/, 13];
            case 13: return [2 /*return*/];
        }
    });
}); };
// 注册翻译命令
figma.parameters.on('input', function (_a) {
    var key = _a.key, result = _a.result;
    console.log('[Figma Translator] Command input:', { key: key });
    switch (key) {
        case 'translate':
            result.setSuggestions(['Translate to English']);
            break;
        default:
            return;
    }
});
// 处理命令
figma.on('run', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var settings_1, selection, clone, translatedCount_1, error_2;
    var command = _b.command;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                console.log('[Figma Translator] Running command:', command);
                if (!(command === 'translate')) return [3 /*break*/, 5];
                // 检查是否有选中的节点
                if (figma.currentPage.selection.length === 0) {
                    console.log('[Figma Translator] No selection found');
                    figma.notify('Please select at least one layer');
                    return [2 /*return*/];
                }
                _c.label = 1;
            case 1:
                _c.trys.push([1, 4, , 5]);
                return [4 /*yield*/, figma.clientStorage.getAsync('settings')];
            case 2:
                settings_1 = _c.sent();
                console.log('[Figma Translator] Translation settings:', settings_1);
                if (!(settings_1 === null || settings_1 === void 0 ? void 0 : settings_1.apiKey) || !(settings_1 === null || settings_1 === void 0 ? void 0 : settings_1.apiEndpoint) || !(settings_1 === null || settings_1 === void 0 ? void 0 : settings_1.modelName)) {
                    console.log('[Figma Translator] Missing API configuration');
                    figma.notify('Please configure API settings first');
                    figma.showUI(__html__, { width: 400, height: 500 });
                    return [2 /*return*/];
                }
                selection = figma.currentPage.selection[0];
                console.log('[Figma Translator] Selected node:', {
                    type: selection.type,
                    name: selection.name,
                    id: selection.id
                });
                clone = selection.clone();
                console.log('[Figma Translator] Created clone');
                translatedCount_1 = 0;
                return [4 /*yield*/, (0, traverse_1.traverseNode)(clone, function (node) { return __awaiter(void 0, void 0, void 0, function () {
                        var translated, error_3;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!('characters' in node)) return [3 /*break*/, 6];
                                    console.log('[Figma Translator] Translating text:', {
                                        text: node.characters,
                                        nodeType: node.type,
                                        nodeName: node.name
                                    });
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 5, , 6]);
                                    if (!(node.type === "TEXT")) return [3 /*break*/, 3];
                                    console.log('[Figma Translator] Loading fonts for node:', node.name);
                                    return [4 /*yield*/, Promise.all(node.getRangeAllFontNames(0, node.characters.length)
                                            .map(figma.loadFontAsync))];
                                case 2:
                                    _a.sent();
                                    console.log('[Figma Translator] Fonts loaded successfully');
                                    _a.label = 3;
                                case 3: return [4 /*yield*/, (0, translation_1.translateText)(node.characters, settings_1)];
                                case 4:
                                    translated = _a.sent();
                                    node.characters = translated;
                                    translatedCount_1++;
                                    console.log('[Figma Translator] Node translated successfully:', {
                                        original: node.characters,
                                        translated: translated,
                                        nodeType: node.type,
                                        nodeName: node.name
                                    });
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_3 = _a.sent();
                                    console.error('[Figma Translator] Failed to translate node:', {
                                        text: node.characters,
                                        nodeType: node.type,
                                        nodeName: node.name,
                                        error: error_3.message
                                    });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); })];
            case 3:
                _c.sent();
                // 将克隆的节点放在原始节点旁边
                clone.x = selection.x + selection.width + 100;
                clone.y = selection.y;
                // 选中新创建的节点
                figma.currentPage.selection = [clone];
                console.log("[Figma Translator] Translation completed: ".concat(translatedCount_1, " texts translated"));
                figma.notify("Translation completed! (".concat(translatedCount_1, " texts translated)"));
                return [3 /*break*/, 5];
            case 4:
                error_2 = _c.sent();
                console.error('[Figma Translator] Translation failed:', error_2);
                figma.notify('Translation failed: ' + (error_2.message || 'Unknown error'));
                return [3 /*break*/, 5];
            case 5:
                if (command === 'settings') {
                    // 打开设置UI
                    console.log('[Figma Translator] Opening settings UI');
                    figma.showUI(__html__, { width: 400, height: 500 });
                }
                return [2 /*return*/];
        }
    });
}); });


/***/ }),

/***/ "./src/main/service/translation.ts":
/*!*****************************************!*\
  !*** ./src/main/service/translation.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports) {


var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.translateText = translateText;
/**
 * 检测文本是否包含中文字符
 * @param text 要检测的文本
 * @returns 是否包含中文
 */
function containsChinese(text) {
    return /[\u4e00-\u9fa5]/.test(text);
}
/**
 * 调用AI API进行文本翻译
 * @param text 要翻译的文本
 * @param config API配置
 * @returns 翻译后的文本
 */
function translateText(text, config) {
    return __awaiter(this, void 0, Promise, function () {
        var requestBody, response, errorText, data, translatedText, error_1;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    // 如果不包含中文，直接返回原文
                    if (!containsChinese(text)) {
                        console.log('[Figma Translator] Text does not contain Chinese, skipping translation:', text);
                        return [2 /*return*/, text];
                    }
                    console.log('[Figma Translator] Starting translation with config:', {
                        endpoint: config.apiEndpoint,
                        model: config.modelName,
                        provider: config.provider,
                        textLength: text.length
                    });
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 6, , 7]);
                    requestBody = __assign({ model: config.modelName, messages: [
                            {
                                role: "system",
                                content: "You are a professional translator. Translate the following Chinese text to English. Keep the translation concise and natural. Maintain the original formatting. Only return the translated text, without any explanations or additional content."
                            },
                            {
                                role: "user",
                                content: text
                            }
                        ] }, (config.provider === 'deepseek' && {
                        temperature: 0.3,
                        max_tokens: 2000,
                        top_p: 0.95,
                        stream: false
                    }));
                    console.log('[Figma Translator] Request body:', JSON.stringify(requestBody, null, 2));
                    return [4 /*yield*/, fetch(config.apiEndpoint, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer ".concat(config.apiKey)
                            },
                            body: JSON.stringify(requestBody)
                        })];
                case 2:
                    response = _d.sent();
                    console.log('[Figma Translator] API response status:', response.status);
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.text()];
                case 3:
                    errorText = _d.sent();
                    console.error('[Figma Translator] API error response:', errorText);
                    throw new Error("Translation API error: ".concat(response.status, " ").concat(response.statusText));
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    data = _d.sent();
                    console.log('[Figma Translator] API response data:', JSON.stringify(data, null, 2));
                    if (!((_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content)) {
                        console.error('[Figma Translator] Invalid API response format:', data);
                        throw new Error('Invalid API response format');
                    }
                    translatedText = data.choices[0].message.content.trim();
                    console.log('[Figma Translator] Translation result:', {
                        original: text,
                        translated: translatedText,
                        provider: config.provider,
                        model: config.modelName
                    });
                    return [2 /*return*/, translatedText];
                case 6:
                    error_1 = _d.sent();
                    console.error('[Figma Translator] Translation error:', error_1);
                    if (error_1.message.includes('Failed to fetch')) {
                        throw new Error("Failed to connect to ".concat(config.provider, " API. Please check your network connection and API endpoint."));
                    }
                    throw new Error(error_1.message || 'Failed to translate text');
                case 7: return [2 /*return*/];
            }
        });
    });
}


/***/ }),

/***/ "./src/main/utils/traverse.ts":
/*!************************************!*\
  !*** ./src/main/utils/traverse.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, exports) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.traverseNode = traverseNode;
/**
 * 遍历Figma节点的工具函数
 * @param node Figma节点
 * @param callback 处理节点的回调函数
 */
function traverseNode(node, callback) {
    return __awaiter(this, void 0, Promise, function () {
        var _i, _a, child;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: 
                // 处理当前节点
                return [4 /*yield*/, callback(node)];
                case 1:
                    // 处理当前节点
                    _b.sent();
                    if (!('children' in node)) return [3 /*break*/, 5];
                    _i = 0, _a = node.children;
                    _b.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                    child = _a[_i];
                    return [4 /*yield*/, traverseNode(child, callback)];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main/code.ts");
/******/ 	
/******/ })()
;