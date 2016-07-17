'use strict';

const TimerMixin = require('react-timer-mixin');

import React from 'react';
import {
  StyleSheet,
  Text,
  ScrollView,
  View,
  TouchableWithoutFeedback
} from 'react-native';


const PAGE_CHANGE_DELAY = 4000;

/**
 * Animates pages in cycle
 * (loop possible if children count > 1)
*/
var Carousel = React.createClass({
  propTypes:{
    children: React.PropTypes.node.isRequired,
    delay: React.PropTypes.number,
    style: View.propTypes.style,
    pageStyle: View.propTypes.style,
    contentContainerStyle: View.propTypes.style,
    autoplay: React.PropTypes.bool,
    pageInfo: React.PropTypes.bool,
    pageInfoBackgroundColor: React.PropTypes.string,
    pageInfoTextStyle: Text.propTypes.style,
    pageInfoTextSeparator: React.PropTypes.string,
    onAnimateNextPage: React.PropTypes.func,
    chosen: React.PropTypes.number
  },
  mixins: [TimerMixin],
  getDefaultProps() {
    return {
      delay: PAGE_CHANGE_DELAY,
      autoplay: true,
      pageInfo: false,
      pageInfoBackgroundColor: 'rgba(0, 0, 0, 0.25)',
      pageInfoTextSeparator: ' / ',
    };
  },
  getInitialState() {
    if (!!this.props.children) {
      var childrenCount = this.props.children.length;
      return {
        contentOffset: {x: 0, y: 0},
        currentPage: this.props.chosen == undefined ? 0 : this.props.chosen,
        chosen: this.props.chosen == undefined ? 0 : this.props.chosen,
        hasChildren: true,
        size: { width: 0, height: 0 }
      };
    } else {
      return {
        hasChildren: false,
        size: { width: 0, height: 0 }
      }
    }
  },
  componentDidMount(){
    if (this.state.hasChildren) {
      this._setUpTimer();
    }
  },
  _onScrollBegin(event) {
    this.clearTimeout(this.timer);
  },
  _onScrollEnd(event) {
    this._setUpTimer();
    var offset = Object.assign({}, event.nativeEvent.contentOffset);
    this.setState({
      currentPage: Math.floor(offset.x / this.state.size.width),
    });
  },
  _onLayout() {
    let self = this;
    this.refs.container.measure(function(x, y, w, h, px, py) {
      self.setState({
        contentOffset: { x: w * self.state.currentPage },
        size: { width: w, height: h}
      });
    });
  },
  _setUpTimer() {
    //only for cycling
    if (this.props.autoplay && this.props.children.length > 1) {
      this.clearTimeout(this.timer);
      this.timer = this.setTimeout(this._animateNextPage, this.props.delay);
    }
  },
  _animateNextPage() {
    var k = this.state.currentPage;
    var size = this.state.size;
    k++;

    this.setState({currentPage: k});
    this.refs.scrollView.scrollTo({ y: 0, x: k*size.width });
    this._setUpTimer();
  },
  _animateToPage(p){
    this.clearTimeout(this.timer);
    let size = this.state.size;

    this.setState({currentPage: p});
    this.refs.scrollView.scrollTo({y: 0, x:p*size.width});
    this._setUpTimer();
  },
  _calculateCurrentPage(offset) {
    var size = this.state.size;
    var page = Math.floor((offset - size.width/2) / size.width) + 1;
    this.setState({currentPage: page}, () => {
      if (this.props.onAnimateNextPage) {
        this.props.onAnimateNextPage(this.state.currentPage)
      }
    });
  },
  _renderPageInfo(pageLength) {
    return (
      <View style={styles.pageInfoBottomContainer} pointerEvents="none">
        <View style={styles.pageInfoContainer}>
          <View style={[styles.pageInfoPill, { backgroundColor: this.props.pageInfoBackgroundColor }]}>
            <Text style={[styles.pageInfoText, this.props.pageInfoTextStyle]}>{`${this.state.currentPage}${this.props.pageInfoTextSeparator}${pageLength}`}</Text>
          </View>
        </View>
      </View>
    );
  },
  render() {
    var pages = [],
      bounces = false,
      contents,
      bullets,
      containerProps;

    var size = this.state.size;

    containerProps = {
      ref: 'container',
      onLayout: this._onLayout,
      style: [this.props.style]
    };

    if (!this.state.hasChildren) {
      contents = (
        <Text style={{backgroundColor: 'white'}}>
          You are supposed to add children inside Carousel
        </Text>
      );
    }

    var children = this.props.children;
    if (children.length > 1) {
      bullets = children.map((child, i) =>{
        return (
          <TouchableWithoutFeedback onPress={() => this._animateToPage(i)} key={"bullet"+i}>
            <View style={i == this.state.currentPage ? styles.chosenBullet : styles.bullet} />
          </TouchableWithoutFeedback>)
      });
      bounces = true;
    }

    pages = children.map((page, i) =>
        <View style={[{width: size.width, height: size.height}, this.props.pageStyle]} key={"page"+i}>
          {page}
        </View>
    );

    contents = (
      <ScrollView
        ref='scrollView'
        onScrollBeginDrag={this._onScrollBegin}
        onMomentumScrollEnd={this._onScrollEnd}
        alwaysBounceHorizontal={bounces}
        alwaysBounceVertical={false}
        contentInset={{top:0}}
        automaticallyAdjustContentInsets={false}
        showsHorizontalScrollIndicator={false}
        horizontal={true}
        pagingEnabled={true}
        bounces={bounces}
        contentOffset={this.state.contentOffset}
        contentContainerStyle={[
          styles.horizontalScroll,
          this.props.contentContainerStyle,
          {
            width: size.width * this.props.children.length,
            height: size.height,
          }
        ]}
      >
        {pages}
      </ScrollView>);
      return (
        <View {...containerProps}>
          {contents}
          <View style={styles.container}>
            {bullets}
          </View>
        </View>
      );
  },
});

var styles = StyleSheet.create({
  horizontalScroll: {
    position:'absolute',
  },
  pageInfoBottomContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  pageInfoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  pageInfoPill: {
    width: 80,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageInfoText: {
    textAlign: 'center',
  },
  container: {
    position:'absolute',
    left:0,
    right:0,
    bottom:10,
    height:30,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  chosenBullet: {
    marginLeft: 10,
    width: 5,
    height: 5,
    borderRadius: 10,
    backgroundColor: 'white'
  },
  bullet: {
    marginLeft: 10,
    width: 5,
    height: 5,
    borderRadius: 10,
    backgroundColor: 'grey',
  }
});

module.exports = Carousel;
