'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('funnelChart100DevCtrl', funnelChart100DevCtrl);

  funnelChart100DevCtrl.$inject = ['$scope', 'ALL_RECORDS_SIZE', 'Query', '$resource', '$q', 'API', 'PagedCollection','CommonUtils'];

  function funnelChart100DevCtrl($scope, ALL_RECORDS_SIZE, Query, $resource, $q, API, PagedCollection, CommonUtils) {
    __init()

    function __init() {
      if ($scope.config.funnelModuleType == 0) { populateData(); }
      else {
        populateCustomData();
      }
    }

    $scope.color = {
      layer1 : '#0598A1',
      layer2 : '#20B4BD',
      layer3 : '#36CDD7',
      layer4 : '#3ACAD3'
    }

    //to populate funnel for custom module
    function populateCustomData() {
      $scope.config.moduleList = [];
      var filters = {
        query: $scope.config.query
      };
      var pagedTotalData = new PagedCollection($scope.config.customModule, null, null);
      pagedTotalData.loadByPost(filters).then(function () {
        $scope.config.layers.forEach((layer, index) => {
          var tempArray = layer.value.split('.');
          if(tempArray.length > 1){
            var data = pagedTotalData.fieldRows[0][$scope.config.customModuleField].value;
            tempArray.forEach(function (value){
              data = data[value];
            })
            $scope.config.moduleList.push({ 'title': layer.title, 'data': data })
          }
          else{
            var data = pagedTotalData.fieldRows[0][$scope.config.customModuleField].value[layer.value];
            $scope.config.moduleList.push({ 'title': layer.title, 'data': data })
          }
        });
        createFunnel();
      })
    }

    //populate data for fsr modules
    function populateData() {
      var promises = [];
      $scope.config.moduleList = [];
      $scope.config.layers.forEach((layer, index) => {
        var countAggregate = {
          alias: layer.value,
          field: '*',
          operator: 'count'
        };
        layer.query.aggregates = [countAggregate];
        layer.query.limit = ALL_RECORDS_SIZE;
        var _queryObj = new Query(layer.query);
        var promise = getResourceData(layer.value, _queryObj).then(function (result) {
          if (result && result['hydra:member'] && result['hydra:member'].length > 0) {
            $scope.config.moduleList.push({ 'title': layer.title, 'data': result['hydra:member'][0][layer.value] })
          }
        });
        promises.push(promise);
      });
      $q.all(promises).then(function () {
        createFunnel();
      })
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

    function createFunnel() {
      var margin = 0;
      var width = 15 + (30 * ($scope.config.layers.length + 3));
      var parentDiv = document.getElementById("funnelChartParentDiv"+$scope.config.wid)
      parentDiv.setAttribute('style', "position: relative; z-index: 1;padding-top:10px;")
      for (let i = 0; i < $scope.config.layers.length; i++) {
        var funnel = document.createElement('div');
        var leftTaper = document.createElement('div');
        var centerTaper = document.createElement('div');
        var rightTaper = document.createElement('div');

        funnel.setAttribute('class', 'position-relative funnelTop-' + ($scope.config.layers.length - i - 1));
        leftTaper.setAttribute('class', 'taper-left');
        centerTaper.setAttribute('class', 'taper-center cont');
        rightTaper.setAttribute('class', 'taper-right');

        // set colour for funnel
        leftTaper.setAttribute('style', 'border-color:' + $scope.color['layer'+(i+1)] + ' transparent');
        rightTaper.setAttribute('style', 'border-color:' + $scope.color['layer'+(i+1)] + ' transparent');
        centerTaper.setAttribute('style', 'background-color:' + $scope.color['layer'+(i+1)] +'; width :' + width + 'px;');
        funnel.setAttribute("style", "margin-left:" + margin + 'px; z-index:' + ($scope.config.layers.length - i) + "; display:flex; margin-bottom:10px");

        var innerTxt =  document.createElement('div');
        innerTxt.innerHTML= $scope.config.moduleList[i].title;

        innerTxt.setAttribute('style', "text-overflow: ellipsis;overflow: hidden;white-space: nowrap; padding-left:15px; padding-right:15px")
        innerTxt.setAttribute('title', $scope.config.moduleList[i].title)

        var count = document.createElement('div');
        count.innerHTML = $scope.config.moduleList[i].data;

        centerTaper.appendChild(innerTxt);
        centerTaper.appendChild(count);
        funnel.appendChild(leftTaper);
        funnel.appendChild(centerTaper);
        funnel.appendChild(rightTaper);
        parentDiv.appendChild(funnel);

        margin = margin + 15;
        width = width - 30;
      }
    }
  }
})();
