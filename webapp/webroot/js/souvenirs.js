$(function () {
  $('input.ui-datetime').datetimepicker({
    dateFormat: 'yy-mm-dd',
    timeFormat: 'HH:mm:ss',
    showSecond: true
  });
});

function error(msg) {
  window.alert('ERROR: ' + msg);
}

var souvenirsApp = angular.module('souvenirsApp', ['hawkular.charts']);

souvenirsApp.controller('ItemsCtrl', function ($scope) {
  $scope.items = [
    {
      'name': 'Gabian',
      'snippet': 'Véritable Gabian de Riou.',
      'image': {
        'src': 'img/Larus_portrait.jpg',
        'alt': 'Gabian de Riou'
      },
      'details': '#'
    },
    {
      'name': 'Agrandisseur de sardines',
      'snippet': 'L\'original. Fabriqué à Endoume.',
      'image': {
        'src': 'img/sardine.jpg',
        'alt': 'Agrandisseur de sardines'
      },
      'details': '/agrandisseur-sardines.html'
    },
    {
      'name': 'Camion à Pizza',
      'snippet': 'Exemplaire unique. Très peu servi.',
      'image': {
        'src': 'img/camion-pizza.jpg',
        'alt': 'Camion à Pizza'
      },
      'details': '#'
    }
  ];
});

souvenirsApp.controller('LikesCtrl', function ($scope, $http) {
  $scope.likes = 0;

  $http.get('rest/likes').success(function (data) {
    $scope.likes = data.value;
  });

  $scope.increment = function () {
    $http.post('rest/likes/increment').success(function (data) {
      $scope.likes = data.value;
    });
  }
});

souvenirsApp.controller('ChartCtrl', function ($scope, $http) {
  var dateTimeFormat = 'YYYY-MM-DD HH:mm:ss';
  var authdata = btoa('admin:pa55,Word');

  $scope.reset = function () {
    $scope.metricType = 'gauge';
    $scope.metricName = '';
    $scope.metrics = [];

    var now = moment();
    $scope.start = now.clone().subtract(5, 'm').format(dateTimeFormat);
    $scope.end = now.format(dateTimeFormat);

    $scope.chartData = [];

    $scope.getMetricNames();
  };

  $scope.getMetricNames = function () {
    $http.get('http://localhost:8080/hawkular/metrics/metrics', {
      headers: {
        'Authorization': 'Basic ' + authdata
      },
      params: {
        'type': $scope.metricType
      }
    }).then(function (response) {
      $scope.metrics = _.map(response.data, function (m) {
        return m.id;
      });
    }, function (response) {
      console.error(response);
      window.alert('HTTP error')
    });
  };

  $scope.hasData = function () {
    return $scope.chartData.length > 0;
  };

  $scope.update = function () {
    var start = moment($scope.start, dateTimeFormat, true);
    if (!start.isValid()) {
      error('Invalid start moment');
      return;
    }
    var end = moment($scope.end, dateTimeFormat, true);
    if (!end.isValid()) {
      error('Invalid end moment');
      return;
    }
    if (end - start <= 0) {
      error('Invalid time range');
      return;
    }

    $http.get('http://localhost:8080/hawkular/metrics/' + $scope.metricType + 's/' + $scope.metricName + '/data', {
      headers: {
        'Authorization': 'Basic ' + authdata
      },
      params: {
        'start': start.valueOf(),
        'end': end.valueOf()
      }
    }).then(function (response) {
      $scope.chartData = response.data;
    }, function (response) {
      console.error(response);
      window.alert('HTTP error')
    });
  };

  $scope.reset();
});
