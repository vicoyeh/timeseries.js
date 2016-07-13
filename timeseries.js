var _ = require('underscore');

var CONFIG = {
	VERSION: '1.0.0'
}

/*
|------------------------------
| timeseries class
|------------------------------
*/
var Timeseries = function(data, options) {
	if (!(this instanceof Timeseries)) {
		return new Timeseries(data, options);
	}
	this.data = data || [];
	this.options = options || {};
	return this; 
}

Timeseries.prototype.getData = function() {
	return this.data;
}

Timeseries.prototype.setData = function(data) {
	this.data = data;
	return this;
}

Timeseries.prototype.getDates = function() {
	return _.map(this.data, function(item) {
		return item['date'];
	});
}

Timeseries.prototype.getValues = function() {
	return _.map(this.data, function(item) {
		return item['value'];
	});
}

Timeseries.prototype.max = function() {
	return _.max(this.getValues());
}

Timeseries.prototype.min = function() {
	return _.min(this.getValues());
}

Timeseries.prototype.mean = function() {
	if (this.data.length == 0) {
		return 0;
	}
	var sum = _.reduce(this.getValues(), function(sumsofar, val) {
		return sumsofar + val;
	}, 0)
	return sum/this.data.length;
}

Timeseries.prototype.partition = function(data, left, right, pivotIndex) {
	pivotIndex = this.partition(data, left, right, pivotIndex);
	var pivotVal = data[pivotIndex]
	data[pivotIndex] = data[right];
	data[right] = pivotVal;
	var fillPos = left;
	for (var i = left; i < right; i++) {
		if (data[i] < pivotVal) {
			var temp = data[i];
			data[i] = data[fillPos];
			data[fillPos] = temp;
			fillPos++;			
		}		
	}
	var temp = data[fillPos];
	data[fillPos] = data[right];
	data[right] = temp;
	return fillPos;
}

Timeseries.prototype.median = function() {
	var left = 0;
	var right = this.data.length - 1;
	var medianIndex = Math.floor(this.data.length / 2);
	var data_copy = this.getValues();
	while (left < right) {
		var pivotIndex = Math.floor((left + right) / 2);
		if (medianIndex == pivotIndex) {
			return data_copy[medianIndex];
		}
		else if (medianIndex < pivotIndex) {
			right = pivotIndex - 1;
		}
		else {
			left = pivotIndex + 1;
		}
	}
	return data_copy[left];
}

/*
|------------------------------
| utility functions
|------------------------------
*/
var Util = {};

Util.convert =  function(data, options) {
	options = _.extend({
		date: 'date',
		value: 'value'
	}, options);
	return _.map(data, function(item) {
		return {date: new Date(item[options.date]), 
						value: item[options.value]};
	});
}

Util.convertArray = function(data, options) {
	return _.map(data, function(val) {
		return {date: new Date(),
						value: val}
	})
}

module.exports = {
	create: Timeseries,
	util: Util
}
