var React = require('react');
var merge = require('lodash.merge');
var has = require('lodash.has');
var isArray = require('lodash.isarray');
var { style } = require('react-matterkit');
var { CustomDrag } = require('react-matterkit').utils;

import Sizeable from './Sizeable';
import Block from './Block';

class Divider extends Sizeable {

  constructor (opt) {
    this.direction = has(opt, 'direction') ? opt.direction : 'row';
    this.childTypes = {
      divider: Divider,
      block: Block,
    };

    super(opt);

  }

  get type() {
    return 'divider';
  }

  set direction(v) {
    if (v !== 'row' && v !== 'column') throw Error;
    if (v === this._direction) return;
    this._direction = v;
    this._reportChange();
  }
  get direction() {
    return  this._direction;
  }



  _onDragResizer(md) {

    var move = this.direction === 'row' ? md.dx : md.dy;
    var moveFlex = move * md.flexPerPx;
    var prevChild = this.children[md.idx - 1];
    var nextChild = this.children[md.idx];

    prevChild.size = md.prevChildSize + (prevChild.sizeMode === 'fix' ? move : moveFlex);
    nextChild.size = md.nextChildSize - (nextChild.sizeMode === 'fix' ? move : moveFlex);
    this._reportChange();
  }

  getComponent() {
    return <DividerComp
      size={this.size}
      sizeMode={this.sizeMode}
      resizeable={this.resizeable}
      direction={this.direction}
      onDragResizer={md => this._onDragResizer(md)}
      childModels={this.children}>
      {this.children.map(child => child.getComponent())}
    </DividerComp>;
  }
}

var DividerComp = React.createClass({

  getContainerStyle(size, sizeMode) {

    var flex, width = '100%', height = '100%';

    if (sizeMode === 'fix') {

      if (this.props.direction === 'row') {

        width = size + 'px';
      }
      else {
        height = size + 'px';
      }
    }
    else if (sizeMode === 'flex') {

      flex = size;
    }

    return {
      flex, width, height,
      // border:'solid 1px black',
      position: 'relative',
      // background: getColor(),
    };
  },

  _getFlexPerPx() {

    var br = this.getDOMNode().getBoundingClientRect();
    var fullPx = this.props.direction === 'row' ? br.width : br.height;
    var fullFlex = 0;

    this.props.childModels.forEach(function (child) {

      if (child.sizeMode === 'fix') {

        fullPx -= child.size;
      }
      else {
        fullFlex += child.size;
      }
    });

    return fullFlex / fullPx;
  },

  render() {

    var _prevChild;
    var children = React.Children.map(this.props.children, (child, idx) => {

      var size = child.props.size;
      var sizeMode = child.props.sizeMode;
      var contStyle = this.getContainerStyle(size, sizeMode);
      var resizer;

      if (idx > 0 && child.props.resizeable &&  _prevChild.props.resizeable) {

        let prevChildSize = _prevChild.size;

        resizer = <ResizerComp
          onDown={() => ({
            idx,
            flexPerPx: this._getFlexPerPx(),
            prevChildSize: prevChildSize,
            nextChildSize: size,
          })}
          direction={this.props.direction}
          onDrag={md => this.props.onDragResizer(md)}/>;
      }

      _prevChild = child;

      return <div style={contStyle} key={idx}>
        {child}
        {resizer}
      </div>;
    });

    var s = {
      display: 'flex',
      position: 'absolute',
      flexDirection: this.props.direction,
      width: '100%',
      height: '100%',
      background: style.grey.normal,
    };

    return <div style={s}>
      {children}
    </div>;
  }
});







var ResizerComp = React.createClass({

  getInitialState() {
    return {
      hover: false,
      dragging: false,
    };
  },

  componentDidMount() {

    new CustomDrag({
      deTarget: this.getDOMNode(),
      onDown: () => {
        this.setState({dragging: true});
        return this.props.onDown();
      },
      onDrag: this.props.onDrag,
      onUp: () => this.setState({dragging: false}),
    });
  },

  render() {

    var s = {
      position: 'absolute',
      backgroundColor: style.palette.blue,
      cursor: 'pointer',
      opacity: this.state.hover || this.state.dragging ? 1 : 0,
    };

    if (this.props.direction === 'column'){
      merge(s, {
        width: '100%',
        height: 4,
        top: -2,
      });
    }
    else {
      merge(s, {
        width: 4,
        height: '100%',
        top: 0,
        left: -2,
      });
    }

    return <div style={s}
      onMouseEnter={() => this.setState({hover: true})}
      onMouseLeave={() => this.setState({hover: false})}
    />;
  }
});

module.exports = Divider;