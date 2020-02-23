var explain = (function () {
  'use strict';

  const PSEUDO_CLASSES = [
    'active',
    // 'any-link',
    // 'blank',
    'checked',
    // 'current',
    // 'default',
    // 'defined',
    'disabled',
    // 'drop',
    // 'empty',
    'enabled',
    // 'first',
    // 'first-child',
    // 'first-of-type',
    // 'fullscreen',
    // 'future',
    'focus',
    // 'focus-visible',
    // 'focus-within',
    // 'host',
    'hover',
    // 'indeterminate',
    // 'in-range',
    'invalid',
    // 'last-child',
    // 'last-of-type',
    // 'left',
    // 'link',
    // 'local-link',
    // 'only-child',
    // 'only-of-type',
    // 'optional',
    // 'out-of-range',
    // 'past',
    // 'placeholder-shown',
    'read-only',
    // 'read-write',
    'required',
    // 'right',
    // 'root',
    // 'scope',
    // 'target',
    // 'target-within',
    // 'user-invalid',
    'valid',
    'visited',
  ];

  var withQuotes = item => `‘${item}’`;

  const getPseudoElement = ({ pseudos = [] }) =>
    pseudos
      .map(pseudo => pseudo.name)
      .find(pseudo => pseudo && !PSEUDO_CLASSES.includes(pseudo));

  var parsePseudoElement = subject => {
    const pseudoElement = getPseudoElement(subject);

    if (pseudoElement) {
      return `the ${withQuotes(pseudoElement)} pseudo-element of `
    }

    return ''
  };

  var enumerate = items => {
    return items.reduce((acc, item, index) => {
      if (index === 0) return acc + item
      if (index === items.length - 1) return acc + ' and ' + item
      else return acc + ', ' + item
    }, '')
  };

  const isPseudoClass = ({ name }) => PSEUDO_CLASSES.includes(name);

  const explainPseudoClass = ({ name }) => {
    switch (name) {
      case 'hover':
        return 'hovered'
      case 'active':
        return 'active'
      case 'focus':
        return 'focused'
      case 'checked':
        return 'checked'
    }
  };

  var parsePseudoClasses = ({ pseudos = [] }) =>
    enumerate(pseudos.filter(isPseudoClass).map(explainPseudoClass));

  var getSelectorContext = selector => parsePseudoClasses(selector);

  var as = subject => {
    const { id, tagName } = subject;
    const pseudo = parsePseudoElement(subject);
    const context = getSelectorContext(subject);
    const tag = tagName && tagName !== '*' ? `<${tagName}>` : '';
    const article =
      id || ['html', 'body', 'head'].includes(tagName)
        ? 'the'
        : context || tag
        ? 'a'
        : 'an';

    return pseudo + [article, context, tag, 'element'].filter(Boolean).join(' ')
  };

  var pluralise = singular => items => {
    if (items.length === 1) return singular
    else {
      if (singular.endsWith('s')) return singular + 'es'
      else return singular + 's'
    }
  };

  const explainAttrOperator = operator => {
    switch (operator) {
      case '=':
        return 'is'
      case '*=':
        return 'contains'
      case '^=':
        return 'starts with'
      case '$=':
        return 'ends with'
    }
  };

  var parseAttributes = ({ attrs = [] }) =>
    enumerate(
      attrs.map(
        ({ name, value, operator }) =>
          'an attribute ' +
          (value
            ? `${withQuotes(name)} whose value ${explainAttrOperator(
              operator
            )} ${withQuotes(value)}`
            : withQuotes(name))
      )
    );

  var parseClasses = ({ classNames = [] }) =>
    classNames.length > 0
      ? pluralise('class')(classNames) +
        ' ' +
        enumerate(classNames.map(withQuotes))
      : '';

  var parseId = ({ id }) => (id ? `id ${withQuotes(id)}` : '');

  const _with = items => {
    return items.reduce((acc, item, index) => {
      if (index === 0) return acc + 'with ' + item
      else return acc + ' and ' + item
    }, '')
  };

  var getSelectorDetails = selector => {
    const components = [parseId, parseClasses, parseAttributes]
      .map(fn => fn(selector))
      .filter(Boolean);

    return _with(components)
  };

  var explainSelector = selector =>
    [as(selector), getSelectorDetails(selector)].filter(Boolean).join(' ');

  const explainContext = ({ nestingOperator }) => {
    switch (nestingOperator) {
      case '>':
        return ' directly within '
      case '+':
        return ' directly after '
      case '~':
        return ' after '
      default:
        return ' within '
    }
  };

  var joinSelectors = selectors =>
    selectors.reduce((acc, selector, index) => {
      const outcome = acc + explainSelector(selector);
      const isFirst = index === 0;
      const context = explainContext(selector);

      if (index === selectors.length - 1) {
        return outcome
      }
      return outcome + (isFirst ? '' : ' itself') + context
    }, '');

  function CssSelectorParser() {
    this.pseudos = {};
    this.attrEqualityMods = {};
    this.ruleNestingOperators = {};
    this.substitutesEnabled = false;
  }

  CssSelectorParser.prototype.registerSelectorPseudos = function(name) {
    for (var j = 0, len = arguments.length; j < len; j++) {
      name = arguments[j];
      this.pseudos[name] = 'selector';
    }
    return this;
  };

  CssSelectorParser.prototype.unregisterSelectorPseudos = function(name) {
    for (var j = 0, len = arguments.length; j < len; j++) {
      name = arguments[j];
      delete this.pseudos[name];
    }
    return this;
  };

  CssSelectorParser.prototype.registerNumericPseudos = function(name) {
      for (var j = 0, len = arguments.length; j < len; j++) {
          name = arguments[j];
          this.pseudos[name] = 'numeric';
      }
      return this;
  };

  CssSelectorParser.prototype.unregisterNumericPseudos = function(name) {
      for (var j = 0, len = arguments.length; j < len; j++) {
          name = arguments[j];
          delete this.pseudos[name];
      }
      return this;
  };

  CssSelectorParser.prototype.registerNestingOperators = function(operator) {
    for (var j = 0, len = arguments.length; j < len; j++) {
      operator = arguments[j];
      this.ruleNestingOperators[operator] = true;
    }
    return this;
  };

  CssSelectorParser.prototype.unregisterNestingOperators = function(operator) {
    for (var j = 0, len = arguments.length; j < len; j++) {
      operator = arguments[j];
      delete this.ruleNestingOperators[operator];
    }
    return this;
  };

  CssSelectorParser.prototype.registerAttrEqualityMods = function(mod) {
    for (var j = 0, len = arguments.length; j < len; j++) {
      mod = arguments[j];
      this.attrEqualityMods[mod] = true;
    }
    return this;
  };

  CssSelectorParser.prototype.unregisterAttrEqualityMods = function(mod) {
    for (var j = 0, len = arguments.length; j < len; j++) {
      mod = arguments[j];
      delete this.attrEqualityMods[mod];
    }
    return this;
  };

  CssSelectorParser.prototype.enableSubstitutes = function() {
    this.substitutesEnabled = true;
    return this;
  };

  CssSelectorParser.prototype.disableSubstitutes = function() {
    this.substitutesEnabled = false;
    return this;
  };

  function isIdentStart(c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c === '-') || (c === '_');
  }

  function isIdent(c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c === '-' || c === '_';
  }

  function isHex(c) {
    return (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F') || (c >= '0' && c <= '9');
  }

  var identSpecialChars = {
    '!': true,
    '"': true,
    '#': true,
    '$': true,
    '%': true,
    '&': true,
    '\'': true,
    '(': true,
    ')': true,
    '*': true,
    '+': true,
    ',': true,
    '.': true,
    '/': true,
    ';': true,
    '<': true,
    '=': true,
    '>': true,
    '?': true,
    '@': true,
    '[': true,
    '\\': true,
    ']': true,
    '^': true,
    '`': true,
    '{': true,
    '|': true,
    '}': true,
    '~': true
  };

  var strReplacementsRev = {
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
    '\f': '\\f',
    '\v': '\\v'
  };

  var singleQuoteEscapeChars = {
    n: '\n',
    r: '\r',
    t: '\t',
    f: '\f',
    '\\': '\\',
    '\'': '\''
  };

  var doubleQuotesEscapeChars = {
    n: '\n',
    r: '\r',
    t: '\t',
    f: '\f',
    '\\': '\\',
    '"': '"'
  };

  function ParseContext(str, pos, pseudos, attrEqualityMods, ruleNestingOperators, substitutesEnabled) {
    var chr, getIdent, getStr, l, skipWhitespace;
    l = str.length;
    chr = null;
    getStr = function(quote, escapeTable) {
      var esc, hex, result;
      result = '';
      pos++;
      chr = str.charAt(pos);
      while (pos < l) {
        if (chr === quote) {
          pos++;
          return result;
        } else if (chr === '\\') {
          pos++;
          chr = str.charAt(pos);
          if (chr === quote) {
            result += quote;
          } else if (esc = escapeTable[chr]) {
            result += esc;
          } else if (isHex(chr)) {
            hex = chr;
            pos++;
            chr = str.charAt(pos);
            while (isHex(chr)) {
              hex += chr;
              pos++;
              chr = str.charAt(pos);
            }
            if (chr === ' ') {
              pos++;
              chr = str.charAt(pos);
            }
            result += String.fromCharCode(parseInt(hex, 16));
            continue;
          } else {
            result += chr;
          }
        } else {
          result += chr;
        }
        pos++;
        chr = str.charAt(pos);
      }
      return result;
    };
    getIdent = function() {
      var result = '';
      chr = str.charAt(pos);
      while (pos < l) {
        if (isIdent(chr)) {
          result += chr;
        } else if (chr === '\\') {
          pos++;
          if (pos >= l) {
            throw Error('Expected symbol but end of file reached.');
          }
          chr = str.charAt(pos);
          if (identSpecialChars[chr]) {
            result += chr;
          } else if (isHex(chr)) {
            var hex = chr;
            pos++;
            chr = str.charAt(pos);
            while (isHex(chr)) {
              hex += chr;
              pos++;
              chr = str.charAt(pos);
            }
            if (chr === ' ') {
              pos++;
              chr = str.charAt(pos);
            }
            result += String.fromCharCode(parseInt(hex, 16));
            continue;
          } else {
            result += chr;
          }
        } else {
          return result;
        }
        pos++;
        chr = str.charAt(pos);
      }
      return result;
    };
    skipWhitespace = function() {
      chr = str.charAt(pos);
      var result = false;
      while (chr === ' ' || chr === "\t" || chr === "\n" || chr === "\r" || chr === "\f") {
        result = true;
        pos++;
        chr = str.charAt(pos);
      }
      return result;
    };
    this.parse = function() {
      var res = this.parseSelector();
      if (pos < l) {
        throw Error('Rule expected but "' + str.charAt(pos) + '" found.');
      }
      return res;
    };
    this.parseSelector = function() {
      var res;
      var selector = res = this.parseSingleSelector();
      chr = str.charAt(pos);
      while (chr === ',') {
        pos++;
        skipWhitespace();
        if (res.type !== 'selectors') {
          res = {
            type: 'selectors',
            selectors: [selector]
          };
        }
        selector = this.parseSingleSelector();
        if (!selector) {
          throw Error('Rule expected after ",".');
        }
        res.selectors.push(selector);
      }
      return res;
    };

    this.parseSingleSelector = function() {
      skipWhitespace();
      var selector = {
        type: 'ruleSet'
      };
      var rule = this.parseRule();
      if (!rule) {
        return null;
      }
      var currentRule = selector;
      while (rule) {
        rule.type = 'rule';
        currentRule.rule = rule;
        currentRule = rule;
        skipWhitespace();
        chr = str.charAt(pos);
        if (pos >= l || chr === ',' || chr === ')') {
          break;
        }
        if (ruleNestingOperators[chr]) {
          var op = chr;
          pos++;
          skipWhitespace();
          rule = this.parseRule();
          if (!rule) {
            throw Error('Rule expected after "' + op + '".');
          }
          rule.nestingOperator = op;
        } else {
          rule = this.parseRule();
          if (rule) {
            rule.nestingOperator = null;
          }
        }
      }
      return selector;
    };

    this.parseRule = function() {
      var rule = null;
      while (pos < l) {
        chr = str.charAt(pos);
        if (chr === '*') {
          pos++;
          (rule = rule || {}).tagName = '*';
        } else if (isIdentStart(chr) || chr === '\\') {
          (rule = rule || {}).tagName = getIdent();
        } else if (chr === '.') {
          pos++;
          rule = rule || {};
          (rule.classNames = rule.classNames || []).push(getIdent());
        } else if (chr === '#') {
          pos++;
          (rule = rule || {}).id = getIdent();
        } else if (chr === '[') {
          pos++;
          skipWhitespace();
          var attr = {
            name: getIdent()
          };
          skipWhitespace();
          if (chr === ']') {
            pos++;
          } else {
            var operator = '';
            if (attrEqualityMods[chr]) {
              operator = chr;
              pos++;
              chr = str.charAt(pos);
            }
            if (pos >= l) {
              throw Error('Expected "=" but end of file reached.');
            }
            if (chr !== '=') {
              throw Error('Expected "=" but "' + chr + '" found.');
            }
            attr.operator = operator + '=';
            pos++;
            skipWhitespace();
            var attrValue = '';
            attr.valueType = 'string';
            if (chr === '"') {
              attrValue = getStr('"', doubleQuotesEscapeChars);
            } else if (chr === '\'') {
              attrValue = getStr('\'', singleQuoteEscapeChars);
            } else if (substitutesEnabled && chr === '$') {
              pos++;
              attrValue = getIdent();
              attr.valueType = 'substitute';
            } else {
              while (pos < l) {
                if (chr === ']') {
                  break;
                }
                attrValue += chr;
                pos++;
                chr = str.charAt(pos);
              }
              attrValue = attrValue.trim();
            }
            skipWhitespace();
            if (pos >= l) {
              throw Error('Expected "]" but end of file reached.');
            }
            if (chr !== ']') {
              throw Error('Expected "]" but "' + chr + '" found.');
            }
            pos++;
            attr.value = attrValue;
          }
          rule = rule || {};
          (rule.attrs = rule.attrs || []).push(attr);
        } else if (chr === ':') {
          pos++;
          var pseudoName = getIdent();
          var pseudo = {
            name: pseudoName
          };
          if (chr === '(') {
            pos++;
            var value = '';
            skipWhitespace();
            if (pseudos[pseudoName] === 'selector') {
              pseudo.valueType = 'selector';
              value = this.parseSelector();
            } else {
              pseudo.valueType = pseudos[pseudoName] || 'string';
              if (chr === '"') {
                value = getStr('"', doubleQuotesEscapeChars);
              } else if (chr === '\'') {
                value = getStr('\'', singleQuoteEscapeChars);
              } else if (substitutesEnabled && chr === '$') {
                pos++;
                value = getIdent();
                pseudo.valueType = 'substitute';
              } else {
                while (pos < l) {
                  if (chr === ')') {
                    break;
                  }
                  value += chr;
                  pos++;
                  chr = str.charAt(pos);
                }
                value = value.trim();
              }
              skipWhitespace();
            }
            if (pos >= l) {
              throw Error('Expected ")" but end of file reached.');
            }
            if (chr !== ')') {
              throw Error('Expected ")" but "' + chr + '" found.');
            }
            pos++;
            pseudo.value = value;
          }
          rule = rule || {};
          (rule.pseudos = rule.pseudos || []).push(pseudo);
        } else {
          break;
        }
      }
      return rule;
    };
    return this;
  }

  CssSelectorParser.prototype.parse = function(str) {
    var context = new ParseContext(
        str,
        0,
        this.pseudos,
        this.attrEqualityMods,
        this.ruleNestingOperators,
        this.substitutesEnabled
    );
    return context.parse();
  };

  CssSelectorParser.prototype.escapeIdentifier = function(s) {
    var result = '';
    var i = 0;
    var len = s.length;
    while (i < len) {
      var chr = s.charAt(i);
      if (identSpecialChars[chr]) {
        result += '\\' + chr;
      } else {
        if (
            !(
                chr === '_' || chr === '-' ||
                (chr >= 'A' && chr <= 'Z') ||
                (chr >= 'a' && chr <= 'z') ||
                (i !== 0 && chr >= '0' && chr <= '9')
            )
        ) {
          var charCode = chr.charCodeAt(0);
          if ((charCode & 0xF800) === 0xD800) {
            var extraCharCode = s.charCodeAt(i++);
            if ((charCode & 0xFC00) !== 0xD800 || (extraCharCode & 0xFC00) !== 0xDC00) {
              throw Error('UCS-2(decode): illegal sequence');
            }
            charCode = ((charCode & 0x3FF) << 10) + (extraCharCode & 0x3FF) + 0x10000;
          }
          result += '\\' + charCode.toString(16) + ' ';
        } else {
          result += chr;
        }
      }
      i++;
    }
    return result;
  };

  CssSelectorParser.prototype.escapeStr = function(s) {
    var result = '';
    var i = 0;
    var len = s.length;
    var chr, replacement;
    while (i < len) {
      chr = s.charAt(i);
      if (chr === '"') {
        chr = '\\"';
      } else if (chr === '\\') {
        chr = '\\\\';
      } else if (replacement = strReplacementsRev[chr]) {
        chr = replacement;
      }
      result += chr;
      i++;
    }
    return "\"" + result + "\"";
  };

  CssSelectorParser.prototype.render = function(path) {
    return this._renderEntity(path).trim();
  };

  CssSelectorParser.prototype._renderEntity = function(entity) {
    var currentEntity, parts, res;
    res = '';
    switch (entity.type) {
      case 'ruleSet':
        currentEntity = entity.rule;
        parts = [];
        while (currentEntity) {
          if (currentEntity.nestingOperator) {
            parts.push(currentEntity.nestingOperator);
          }
          parts.push(this._renderEntity(currentEntity));
          currentEntity = currentEntity.rule;
        }
        res = parts.join(' ');
        break;
      case 'selectors':
        res = entity.selectors.map(this._renderEntity, this).join(', ');
        break;
      case 'rule':
        if (entity.tagName) {
          if (entity.tagName === '*') {
            res = '*';
          } else {
            res = this.escapeIdentifier(entity.tagName);
          }
        }
        if (entity.id) {
          res += "#" + this.escapeIdentifier(entity.id);
        }
        if (entity.classNames) {
          res += entity.classNames.map(function(cn) {
            return "." + (this.escapeIdentifier(cn));
          }, this).join('');
        }
        if (entity.attrs) {
          res += entity.attrs.map(function(attr) {
            if (attr.operator) {
              if (attr.valueType === 'substitute') {
                return "[" + this.escapeIdentifier(attr.name) + attr.operator + "$" + attr.value + "]";
              } else {
                return "[" + this.escapeIdentifier(attr.name) + attr.operator + this.escapeStr(attr.value) + "]";
              }
            } else {
              return "[" + this.escapeIdentifier(attr.name) + "]";
            }
          }, this).join('');
        }
        if (entity.pseudos) {
          res += entity.pseudos.map(function(pseudo) {
            if (pseudo.valueType) {
              if (pseudo.valueType === 'selector') {
                return ":" + this.escapeIdentifier(pseudo.name) + "(" + this._renderEntity(pseudo.value) + ")";
              } else if (pseudo.valueType === 'substitute') {
                return ":" + this.escapeIdentifier(pseudo.name) + "($" + pseudo.value + ")";
              } else if (pseudo.valueType === 'numeric') {
                return ":" + this.escapeIdentifier(pseudo.name) + "(" + pseudo.value + ")";
              } else {
                return ":" + this.escapeIdentifier(pseudo.name) + "(" + this.escapeIdentifier(pseudo.value) + ")";
              }
            } else {
              return ":" + this.escapeIdentifier(pseudo.name);
            }
          }, this).join('');
        }
        break;
      default:
        throw Error('Unknown entity type: "' + entity.type(+'".'));
    }
    return res;
  };

  var CssSelectorParser_1 = CssSelectorParser;

  var cssSelectorParser = {
  	CssSelectorParser: CssSelectorParser_1
  };

  var cssSelectorParser$1 = {
    CssSelectorParser: cssSelectorParser.CssSelectorParser
  };
  var cssSelectorParser_1 = cssSelectorParser$1.CssSelectorParser;

  const parser = new cssSelectorParser_1();

  parser.registerSelectorPseudos('has');
  parser.registerNestingOperators('>', '+', '~');
  parser.registerAttrEqualityMods('^', '$', '*', '~');
  parser.enableSubstitutes();

  var parseSelector = selector => {
    try {
      const ast = parser.parse(selector);

      if (ast.type !== 'ruleSet') {
        throw new Error('Unsupported CSS selector')
      }

      return ast
    } catch (error) {
      throw new Error('Invalid CSS selector')
    }
  };

  var findSubject = ast => {
    let id = 0;
    let subject = ast.rule;

    subject.__id = id++;

    while (subject.rule && subject.rule.type === 'rule') {
      subject = subject.rule;
      subject.__id = id++;
    }

    return subject
  };

  var getParentNode = (ast, node) => {
    let current = ast;

    while (current.rule && current.__id !== node.__id - 1) {
      current = current.rule;
    }

    return current.__id === node.__id - 1 ? current : null
  };

  var getSelectors = selector => {
    const ast = parseSelector(selector);
    const subject = findSubject(ast);
    const selectors = [subject];
    let parent = null;

    while ((parent = getParentNode(ast, parent || subject))) {
      selectors.push(parent);
    }

    return selectors
  };

  var index = selector => joinSelectors(getSelectors(selector));

  return index;

}());