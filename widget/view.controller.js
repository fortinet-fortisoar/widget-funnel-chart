'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('funnelChart100DevCtrl', funnelChart100DevCtrl);

  funnelChart100DevCtrl.$inject = ['$scope', 'ALL_RECORDS_SIZE', 'Query', '$resource', '$q', 'API'];

  function funnelChart100DevCtrl($scope, ALL_RECORDS_SIZE, Query, $resource, $q, API) {
    // $scope.modules = $scope.config.modules;
    __init()

    function __init() {
      // $scope.modules = [];
      // for(var i = 1; i <= $scope.config.funnelLevel; i++){
      //   $scope.modules.push($scope.config['module'+i]);
      // }
      // console.log($scope.modules1);
      populateData();
    }

    function createFunnel() {
      var margin = 0;
      var width = 15 + (30 * ($scope.config.funnelLevel + 3));
      var red = 30;
      var green = 150;
      var blue = 240;
      var parentDiv = document.getElementById('parentDiv')
      for (let i = 0; i < $scope.config.funnelLevel; i++) {
        var funnel = document.createElement('div');
        var leftTaper = document.createElement('div');
        var centerTaper = document.createElement('div');
        var rightTaper = document.createElement('div');
        funnel.setAttribute('class', 'cont')
        leftTaper.setAttribute('class', 'taper-left');
        centerTaper.setAttribute('class', 'taper-center');
        rightTaper.setAttribute('class', 'taper-right');
        // set colour for funnel
        leftTaper.setAttribute('style', 'border-color:'+'rgb(' +red+ ',' + green + ',' + blue + ')'+' transparent');
        rightTaper.setAttribute('style', 'border-color:'+'rgb(' +red+ ',' + green + ',' + blue+ ')' +' transparent');
        centerTaper.setAttribute('style', 'background-color:'+'rgb(' +red+ ',' + green + ',' + blue+ '); width :' + width + 'px;');
        var spacer = document.createElement('div');
        spacer.setAttribute('class', 'spacer');
        funnel.setAttribute("style", "margin-left:" + margin + 'px');

        centerTaper.innerHTML = $scope.config.moduleList[i].name;
        var count = document.createElement('div');
        count.innerHTML = $scope.config.moduleList[i].data;

        centerTaper.appendChild(count);
        funnel.appendChild(leftTaper);
        funnel.appendChild(centerTaper);
        funnel.appendChild(rightTaper);
        parentDiv.appendChild(funnel);
        parentDiv.appendChild(spacer);

        green += 25;
        margin = margin + 15;
        width = width - 30;
      }
    }

    function populateData() {
      $scope.data = [];
      var promises = [];
      $scope.config.moduleList.forEach((module, index) => {
        var promise = getRecords(module.type).then(function (result) {
          if (result && result['hydra:member'] && result['hydra:member'].length > 0) {
            // $scope.totalAlerts = result['hydra:member'][0].alerts;
            $scope.config.moduleList[index].data = result['hydra:member'][0][module.type];
          }
        });
        promises.push(promise);
      });
      $q.all(promises).then(function () {
        createFunnel();
      })
    }

    function getRecords(module) {
      $scope.moduleDataPromise = [];
      $scope.totalAlerts = '';
      if($scope.config.lastRun){
        var dateRangeFilter = [{
          'field': 'createDate',
          'operator': 'date',
          'value': $scope.config.lastRun,
          'type': 'datetime'
        }
        ];
      }
      else{
        var dateRangeFilter = [];
      }

      var countAggregate = {
        alias: module,
        field: '*',
        operator: 'count'
      };
      var _query = {
        filters: dateRangeFilter,
        aggregates: [countAggregate],
        limit: ALL_RECORDS_SIZE
      };
      var _queryObj = new Query(_query);
      return getResourceData(module, _queryObj);
    }
    function getResourceData(resource, queryObject) {
      var defer = $q.defer();
      $resource(API.QUERY + resource).save(queryObject.getQueryModifiers(), queryObject.getQuery(true)).$promise.then(function (response) {
        defer.resolve(response);
      }, function (error) {
        defer.reject(error);
      });
      return defer.promise;
    }

  }
})();
