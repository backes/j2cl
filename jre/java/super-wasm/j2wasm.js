// Copyright 2021 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.module('j2wasm');

const ArrayUtils = goog.require('j2wasm.ArrayUtils');
const CharUtils = goog.require('j2wasm.CharUtils');
const ConsoleUtils = goog.require('j2wasm.ConsoleUtils');
const DoubleUtils = goog.require('j2wasm.DoubleUtils');
const RegExpUtils = goog.require('j2wasm.RegExpUtils');
const StringUtils = goog.require('j2wasm.StringUtils');


/**
 * Instantiates a web assembly module passing the necessary imports and any
 * additional import the user might need to provide for their application.
 *
 * @param {string|!Promise<!Response>} urlOrResponse
 * @param {?Object<string, !Function>=} userImports
 * @return {!Promise<!WebAssembly.Instance>}
 */
async function instantiateStreaming(urlOrResponse, userImports) {
  return instantiateStreamingOverridingImports(
      urlOrResponse, createImportObject(userImports));
}

/**
 * Instantiates a web assembly module passing the specified imports.
 *
 * @param {string|!Promise<!Response>} urlOrResponse
 * @param {!Object<!Object>} imports
 * @return {!Promise<!WebAssembly.Instance>}
 */
async function instantiateStreamingOverridingImports(urlOrResponse, imports) {
  const response =
      typeof urlOrResponse == 'string' ? fetch(urlOrResponse) : urlOrResponse;
  const {instance} = await WebAssembly.instantiateStreaming(response, imports);
  return instance;
}

/**
 * Instantiates a web assembly module passing the necessary imports and any
 * additional import the user might need to provide for their application.
 *
 * Use of this function is discouraged. Many browsers require when calling the
 * WebAssembly constructor that the number of bytes of the module is under a
 * small threshold, mandating the async functions for all non-trivial apps. This
 * function can be used in other contexts, such as the D8 command line.
 *
 * @param {!BufferSource} moduleObject
 * @param {?Object<string, !Function>=} userImports
 * @return {!WebAssembly.Instance}
 */
function instantiateBlocking(moduleObject, userImports) {
  return instantiateBlockingOverridingImports(
      moduleObject, createImportObject(userImports));
}

/**
 * Instantiates a web assembly module passing the specified imports.
 *
 * Use of this function is discouraged. Many browsers require when calling the
 * WebAssembly constructor that the number of bytes of the module is under a
 * small threshold, mandating the async functions for all non-trivial apps. This
 * function can be used in other contexts, such as the D8 command line.
 *
 * @param {!BufferSource} moduleObject
 * @param {!Object<!Object>} imports
 * @return {!WebAssembly.Instance}
 */
function instantiateBlockingOverridingImports(moduleObject, imports) {
  return new WebAssembly.Instance(
      new WebAssembly.Module(moduleObject), imports);
}

/**
 * @param {?Object<string, !Function>=} userImports
 * @return {!Object<!Object>} Wasm import object
 */
function createImportObject(userImports) {
  const jreImports = {
    'Math.acos': Math.acos,
    'Math.asin': Math.asin,
    'Math.atan': Math.atan,
    'Math.atan2': Math.atan2,
    'Math.cbrt': Math.cbrt,
    'Math.cos': Math.cos,
    'Math.cosh': Math.cosh,
    'Math.exp': Math.exp,
    'Math.expm1': Math.expm1,
    'Math.hypot': Math.hypot,
    'Math.log': Math.log,
    'Math.log10': Math.log10,
    'Math.log1p': Math.log1p,
    'Math.pow': Math.pow,
    'Math.random': Math.random,
    'Math.round': Math.round,
    'Math.sign': Math.sign,
    'Math.sin': Math.sin,
    'Math.sinh': Math.sinh,
    'Math.tan': Math.tan,
    'Math.tanh': Math.tanh,
    'Number.prototype.toPrecision.call': (/** number */ n, /** number */ p) =>
        Number.prototype.toPrecision.call(n, p),
    'j2wasm.CharUtils.codePointToLowerCase': CharUtils.codePointToLowerCase,
    'j2wasm.CharUtils.codePointToUpperCase': CharUtils.codePointToUpperCase,
    'j2wasm.CharUtils.charToLowerCase': CharUtils.charToLowerCase,
    'j2wasm.CharUtils.charToUpperCase': CharUtils.charToUpperCase,
    'j2wasm.CharUtils.charFoldCase': CharUtils.charFoldCase,
    'j2wasm.ConsoleUtils.log': ConsoleUtils.log,
    'j2wasm.DoubleUtils.isValidDouble': DoubleUtils.isValidDouble,
    'parseFloat': parseFloat,
    'performance.now': () => performance.now(),

    // String
    'String.indexOf': (/** string */ s, /** string */ r, /** number */ i) =>
        s.indexOf(r, i),
    'String.lastIndexOf': (/** string */ s, /** string */ r, /** number */ i) =>
        s.lastIndexOf(r, i),
    'String.replace': (/** string */ s, /** !RegExp */ re, /** string */ r) =>
        s.replace(re, r),
    'String.toLowerCase': (/** string */ s) => s.toLowerCase(),
    'String.toUpperCase': (/** string */ s) => s.toUpperCase(),
    'String.toLocaleLowerCase': (/** string */ s) => s.toLocaleLowerCase(),
    'String.toLocaleUpperCase': (/** string */ s) => s.toLocaleUpperCase(),
    'j2wasm.StringUtils.equalsIgnoreCase': StringUtils.equalsIgnoreCase,
    'j2wasm.StringUtils.compareToIgnoreCase': StringUtils.compareToIgnoreCase,
    'Number.prototype.toString.call': (/** number */ n, /** number */ r) =>
        Number.prototype.toString.call(n, r),
    // Regex
    'RegExp.constructor': (/** string */ p, /** string */ f) =>
        new RegExp(p, f),
    'RegExp.setLastIndex': (/** !RegExp */ r, /** number */ i) => r.lastIndex =
        i,
    'RegExp.exec': (/** !RegExp */ r, /** string */ s) => r.exec(s),
    'RegExp.test': (/** !RegExp */ r, /** string */ s) => r.test(s),
    'j2wasm.RegExpUtils.getIndex': RegExpUtils.getIndex,

    // TODO(b/193532287): These will be removed after Array interop support in
    // Wasm is implemented.
    'j2wasm.ArrayUtils.createBuffer': ArrayUtils.createBuffer,
    'j2wasm.ArrayUtils.setBufferAt': ArrayUtils.setBufferAt,
    'j2wasm.ArrayUtils.getBufferAt': ArrayUtils.getBufferAt,
    'j2wasm.ArrayUtils.getLength': ArrayUtils.getLength,

    // Date
    'Date.now': Date.now,
    'Date.UTC': Date.UTC,
    'Date.parse': Date.parse,
    'Date.constructor': (...args) => new Date(...args),
    'Date.getDate': (/** !Date */ date) => date.getDate(),
    'Date.getDay': (/** !Date */ date) => date.getDay(),
    'Date.getFullYear': (/** !Date */ date) => date.getFullYear(),
    'Date.getHours': (/** !Date */ date) => date.getHours(),
    'Date.getMilliseconds': (/** !Date */ date) => date.getMilliseconds(),
    'Date.getMinutes': (/** !Date */ date) => date.getMinutes(),
    'Date.getMonth': (/** !Date */ date) => date.getMonth(),
    'Date.getSeconds': (/** !Date */ date) => date.getSeconds(),
    'Date.getTime': (/** !Date */ date) => date.getTime(),
    'Date.getTimezoneOffset': (/** !Date */ date) => date.getTimezoneOffset(),
    'Date.getUTCDate': (/** !Date */ date) => date.getUTCDate(),
    'Date.getUTCFullYear': (/** !Date */ date) => date.getUTCFullYear(),
    'Date.getUTCHours': (/** !Date */ date) => date.getUTCHours(),
    'Date.getUTCMinutes': (/** !Date */ date) => date.getUTCMinutes(),
    'Date.getUTCMonth': (/** !Date */ date) => date.getUTCMonth(),
    'Date.getUTCSeconds': (/** !Date */ date) => date.getUTCSeconds(),
    'Date.toLocaleString': (/** !Date */ date) => date.toLocaleString(),
    'Date.setDate': (/** !Date */ date, /** number */ dayOfMonth) =>
        void date.setDate(dayOfMonth),
    'Date.setFullYear': dateSetFullYear,
    'Date.setHours': dateSetHours,
    'Date.setMinutes': (/** !Date */ date, /** number */ minutes) =>
        void date.setMinutes(minutes),
    'Date.setMonth': (/** !Date */ date, /** number */ month) =>
        void date.setMonth(month),
    'Date.setSeconds': (/** !Date */ date, /** number */ seconds) =>
        void date.setSeconds(seconds),
    'Date.setTime': (/** !Date */ date, /** number */ milliseconds) =>
        void date.setTime(milliseconds),
  };

  return {
    // Pass the imports required by the jre plus the additional provided by the
    // user. The user imports will override the jre imports if they provide
    // the same key.
    'imports': Object.assign({}, jreImports, userImports)
  };
}

/**
 * @param {!Date} date
 * @param {...number} dateParts
 */
function dateSetFullYear(date, ...dateParts) {
  date.setFullYear(...dateParts);
}

/**
 * @param {!Date} date
 * @param {...number} timeParts
 */
function dateSetHours(date, ...timeParts) {
  date.setHours(...timeParts);
}

exports = {
  instantiateStreaming,
  instantiateBlocking,
  instantiateStreamingOverridingImports,
  instantiateBlockingOverridingImports,
};
