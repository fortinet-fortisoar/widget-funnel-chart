'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('funnelChart100DevCtrl', funnelChart100DevCtrl);

  funnelChart100DevCtrl.$inject = ['$scope', 'ALL_RECORDS_SIZE', 'Query', '$resource', '$q', 'API', 'Modules', 'PagedCollection'];
   
  function funnelChart100DevCtrl($scope, ALL_RECORDS_SIZE, Query, $resource, $q, API, Modules, PagedCollection) {
    __init()
 
    function __init() {
      if ($scope.config.funnelModuleType == 0) { populateData(); }
      else { 
        populateCustomData();
      }
    }
    
    //to populate funnel for custom module
    function populateCustomData() {
      $scope.config.moduleList = [];
      console.log($scope.config.query)
      var filters = {
        query: $scope.config.query
      };
      var pagedTotalData = new PagedCollection($scope.config.customModule, null, null);
      pagedTotalData.loadByPost(filters).then(function(){
          $scope.config.layers.forEach((layer, index) => {
            var data = pagedTotalData.fieldRows[0][$scope.config.customModuleField].value[layer.value];
            $scope.config.moduleList.push({ 'name': layer.title, 'data': data })
          });
          createFunnel();
      })
    }

    //populate data for fsr modules
    function populateData(){
      var promises = [];
      $scope.config.moduleList = [];
      $scope.config.layers.forEach((layer, index) =>{
        var countAggregate = {
          alias: layer.value,
          field: '*',
          operator: 'count'
        };
        layer.query.aggregates = [countAggregate];
        layer.query.limit = ALL_RECORDS_SIZE;
        var _queryObj = new Query(layer.query);
        var promise = getResourceData(layer.value, _queryObj).then(function (result){
          if (result && result['hydra:member'] && result['hydra:member'].length > 0) {
            $scope.config.moduleList.push({ 'name': layer.title, 'data': result['hydra:member'][0][layer.value] })
          }
        });
        promises.push(promise);
      });
      $q.all(promises).then(function(){
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
      var red = 30;
      // var green = 130;
      var green  = 235 - (($scope.config.layers.length -1) * 35);
      var blue = 240;
      var parentDiv = document.getElementById('parentDiv'+$scope.config.title)

      parentDiv.setAttribute('style', "position: relative; z-index: 1;")

      for (let i = 0; i < $scope.config.layers.length; i++) {
        var funnel = document.createElement('div');
        var leftTaper = document.createElement('div');
        var centerTaper = document.createElement('div');
        var rightTaper = document.createElement('div');

        funnel.setAttribute('class', 'position-relative cont-' + ($scope.config.layers.length -i - 1) );
        leftTaper.setAttribute('class', 'taper-left');
        centerTaper.setAttribute('class', 'taper-center');
        rightTaper.setAttribute('class', 'taper-right');

        // set colour for funnel
        leftTaper.setAttribute('style', 'border-color:' + 'rgb(' + red + ',' + green + ',' + blue + ')' + ' transparent');
        rightTaper.setAttribute('style', 'border-color:' + 'rgb(' + red + ',' + green + ',' + blue + ')' + ' transparent');
        centerTaper.setAttribute('style', 'background-color:' + 'rgb(' + red + ',' + green + ',' + blue + '); width :' + width + 'px;');

        funnel.setAttribute("style", "margin-left:" + margin + 'px; z-index:' + ( $scope.config.layers.length - i)+"; display:flex; margin-bottom:10px" );

        centerTaper.innerHTML = $scope.config.moduleList[i].name;
        var count = document.createElement('div');
        count.innerHTML = $scope.config.moduleList[i].data;

        centerTaper.appendChild(count);
        funnel.appendChild(leftTaper);
        funnel.appendChild(centerTaper);
        funnel.appendChild(rightTaper);

        parentDiv.appendChild(funnel);

        green += 35;
        margin = margin + 15;
        width = width - 30;
      }
    }
  }
})();
