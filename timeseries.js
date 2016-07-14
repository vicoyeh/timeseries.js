var _ = require('underscore');

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
  this.options = options || {period: 1};
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
  }, 0)
  return sum/this.data.length;
}

Timeseries.prototype.median = function() {
  function partition(data, left, right, pivotIndex) {
    var pivotVal = data[pivotIndex];
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

  var left = 0,
      right = this.data.length - 1,
      medianIndex = Math.floor(this.data.length / 2),
      dataCopy = this.getValues();
  while (left < right) {
    var pivotIndex = Math.floor((left + right) / 2);
    pivotIndex = partition(dataCopy, left, right, pivotIndex);
    if (medianIndex == pivotIndex) {
      return dataCopy[medianIndex];
    }
    else if (medianIndex < pivotIndex) {
      right = pivotIndex - 1;
    }
    else {
      left = pivotIndex + 1;
    }
  }
  return dataCopy[left];
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
  return Math.sqrt(this.var());
}

// variance
Timeseries.prototype.var = function() {
  var avg = this.mean(), sum = 0;
  _.each(this.getValues(), function(val) {
    var diff = val - avg;
    sum +=  diff * diff;
  });
  return sum/(this.data.length-1);
}

//covariance 
Timeseries.prototype.cov = function(timeSeriesTwo) {
  var values = this.getValues();
  var valuesTwo = timeSeriesTwo.getValues();
  if (values.length != valuesTwo.length) {
    throw "Cannot calculate covariance of two different length time series";
  }

  var period = this.options.period;
  var periodTwo = timeSeriesTwo.options.period;
  var mean = this.mean();
  var meanTwo = timeSeriesTwo.mean();
  var sum = 0;
  for(var i = 0; i<values.length; i++) {
    sum += (values[i] - mean) * (valuesTwo[i] - meanTwo);
  }
  return sum/values.length;
}

// simple moving average
Timeseries.prototype.sma = function(options) {
	var values = this.getValues();
	options = _.extend({
		period: (values.length > 10) ? 10: values.length
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
		result.push({date: this.data[i+period-1]['date'],
								 value: sum/period});
	}
	return result;
}

// exponential moving average
Timeseries.prototype.ema = function(options) {
	var values = this.getValues();
	options = _.extend({
		period: (values.length > 10) ? 10: values.length
	}, options);
	var period = options.period,
			values = this.getValues(),
			result = _.times(period-1, _.constant(null)),
			w = 2/(period+1),
			prev = 0,
			i;
	// get the first sma
	for (i=0; i < period; i++) {
		prev += values[i];
	}
	prev /= period;
	result.push({date: this.data[period-1]['date'],
							 value: prev});
	for (i = period; i < this.data.length; i++) {
		prev = (values[i] - prev) * w + prev; 
		result.push({date: this.data[i]['date'],
								 value: prev});
	}
	return result;
}

// linear interpolation
Timeseries.prototype.linearInterpolate = function(date) {
date = _.isDate(date) ? date : new Date(date);
var boundary =  betweenDates(this.data, date);
if (boundary.length === 2) {
  var x1 = boundary[0]['date'], x2 = boundary[1]['date'],
      y1 = boundary[0]['value'], y2 = boundary[1]['value'];
  return y1 + (y2 - y1) * (date - x1) / (x2 - x1);
} else if (boundary.length === 1) {
  return boundary[0]['value'];
} else {
  return null;
}
}

// exponential interpolation
Timeseries.prototype.exponentialInterpolate = function(date) {
date = _.isDate(date) ? date : new Date(date);
var boundary =  betweenDates(this.data, date);
if (boundary.length === 2) {
  var x1 = boundary[0]['date'], x2 = boundary[1]['date'],
      y1 = boundary[0]['value'], y2 = boundary[1]['value'];
  return y1 * Math.pow(y2 / y1, (date - x1) / (x2 - x1));
} else if (boundary.length === 1) {
  return boundary[0]['value'];
} else {
  return null;
}
}


/*
|------------------------------
| utility functions
|------------------------------
*/
var Util = {};

// todo: include rest of the data fields
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

/*
|------------------------------
| helpfer functions
|------------------------------
*/
function betweenDates(data, target) {
var i;
for (i = 0; i < data.length; i++) {
		if (target < data[i]['date']) {
			if (i === 0) { return []; } 
			else { return [data[i-1],  data[i]]; }
		} else if (target.getTime() === data[i]['date'].getTime()) {
			return [data[i]];
		}
	};
	return [];
}

module.exports = {
  create: Timeseries,
  util: Util
}
