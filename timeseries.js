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
	var sum = _.reduce(this.getValues(), function(sumsofar, val) {
		return sumsofar + val;
	}, 0);
	return sum/this.data.length;;
}

Timeseries.prototype.mode = function() {
	var counts = {}, maxFreq = 0, mode;
	_.each(this.getValues(), function(val) {
		counts[val] = (counts[val] || 0) + 1;
		if (maxFreq < counts[val]) {
			maxFreq = counts[val];
			mode = val;
		}
	});
	return mode;
}

// sample standard deviation
Timeseries.prototype.sd = function() {
	var avg = this.mean(), sum = 0;
	_.each(this.getValues(), function(val) {
		var diff = val - avg;
		sum +=  diff * diff;
	});
	return Math.sqrt(sum/(this.data.length-1));
}

// variance
Timeseries.prototype.var = function() {
	var sd = this.sd();
	return sd * sd;
}

Timeseries.prototype.ma = function(options) {
	options = _.extend({
		period: 10
	}, options);
	var period = options.period,
			values = this.getValues(),
			result = _.times(period-1, _.constant(null)),
			sum = 0,
			i, j;
	for (i = 0; i <= this.data.length-period; i++) {
		sum = 0;
		for (j = i; j < i+period; j++) {
			sum += values[j];
		}
		result.push(sum/period);
	}
	return result;
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
