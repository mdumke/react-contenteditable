import React from 'react';

let stripNbsp = str => str.replace(/&nbsp;|\u202F|\u00A0/g, ' ');

export default class ContentEditable extends React.Component {
  constructor() {
    super();
    this.emitChange = this.emitChange.bind(this);
  }

  render() {
    var { tagName, html, ...props } = this.props;

    return React.createElement(
      tagName || 'div',
      {
        ...props,
        ref: (e) => this.htmlEl = e,
        onInput: this.emitChange,
        onBlur: this.props.onBlur || this.emitChange,
        contentEditable: !this.props.disabled,
        dangerouslySetInnerHTML: {__html: html}
      },
      this.props.children);
  }

  shouldComponentUpdate(nextProps) {
    let { props, htmlEl } = this;

    // We need not rerender if the change of props simply reflects the user's edits.
    // Rerendering in this case would make the cursor/caret jump

    // Rerender if there is no element yet... (somehow?)
    if (!htmlEl) {
      return true;
    }

    // ...or if html really changed... (programmatically, not by user edit)
    if (
      stripNbsp(nextProps.html) !== stripNbsp(htmlEl.innerHTML) &&
      nextProps.html !== props.html
    ) {
      return true;
    }

    let optional = ['style', 'className', 'disabled', 'tagName'];

    // Handle additional properties
    return optional.some(name => {
      if (name === 'style') {
        // styles are objects, so comparison by reference will always
        // return false. This means, if the component has a style, it will
        // update after every change, resetting the cursor to position 0
        //
        // the order of keys should not change, so use this insecure comparison
        return JSON.stringify(props.style) !== JSON.stringify(nextProps.style)
      }

      return props[name] !== nextProps[name]
    });
  }

  componentDidUpdate() {
    if ( this.htmlEl && this.props.html !== this.htmlEl.innerHTML ) {
      // Perhaps React (whose VDOM gets outdated because we often prevent
      // rerendering) did not update the DOM. So we update it manually now.
      this.htmlEl.innerHTML = this.props.html;
    }
  }

  emitChange(evt) {
    if (!this.htmlEl) return;
    var html = this.htmlEl.innerHTML;
    if (this.props.onChange && html !== this.lastHtml) {
      // Clone event with Object.assign to avoid 
      // "Cannot assign to read only property 'target' of object"
      var evt = Object.assign({}, evt, { 
        target: { 
          value: html 
        } 
      });
      this.props.onChange(evt);
    }
    this.lastHtml = html;
  }
}
