'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('funnelChart102Ctrl', funnelChart102Ctrl);

  funnelChart102Ctrl.$inject = ['$scope', 'ALL_RECORDS_SIZE', 'Query', '$resource', '$q', 'API', 'PagedCollection', '$rootScope', 'dynamicVariableService', 'CommonUtils'];
  const widgetBroadcastEventFlag = 'EnableGlobalVisiblityBroadcast';

  function funnelChart102Ctrl($scope, ALL_RECORDS_SIZE, Query, $resource, $q, API, PagedCollection, $rootScope, dynamicVariableService, CommonUtils) {
    $scope.color = {
      layer1: '#0598A1',
      layer2: '#20B4BD',
      layer3: '#36CDD7',
      layer4: '#3ACAD3'
    }

    $scope.filterValidation = false;

    __init()

    function __init() {
      dynamicVariableService.loadDynamicVariables().then(function (dynamicVariables){      
        $scope.globalVariables = getObjectById(dynamicVariables, widgetBroadcastEventFlag);
        eventListner();
      });

      if ($scope.config.funnelModuleType == 'Across Modules') { populateData(); }
      else {
        populateCustomData();
      }
    }

    function getObjectById(data, name) {
      for (let i = 0; i < data.length; i++) {
        if (data[i].name === name) {
          if (data[i].value === "true")
          {
            return true;
          }
          else
          {
            return false;
          }
        }
      }
      return false; // return false if no object with the given id is found
    }

    function eventListner(){
      if($scope.globalVariables){
        $rootScope.$on('GlobalVisiblityEvent', function (event, data) {
          if($scope.config.funnelModuleType == 'Single Module'){
            $scope.config.query.filters = [];
            $scope.config.query.filters.push(
              {
                field: "id",
                operator: "eq",
                type: "primitive",
                value: data,
                _operator: "eq"
              }
            )
            populateCustomData(true);
          }
        })
      }
    }

    //to populate funnel for custom module
    function populateCustomData(changeData) {

      var filters = {
        query: $scope.config.query
      };
      var pagedTotalData = new PagedCollection($scope.config.customModule, null, null);
      pagedTotalData.loadByPost(filters).then(function () {
        if (pagedTotalData.fieldRows.length === 0) {
          $scope.filterValidation = true;
          return;
        }
        $scope.config.moduleList = [];
        $scope.config.layers.forEach((layer, index) => {
          var nestedKeysArray = layer.value.split('.');
          if (nestedKeysArray.length > 1) {
            var data = pagedTotalData.fieldRows[0][$scope.config.customModuleField].value;
            nestedKeysArray.forEach(function (value) {
              data = CommonUtils.isUndefined(data) ? undefined : data[value];            
            })
            $scope.config.moduleList.push({ 'title': layer.title, 'data': data })
          }
          else {
            var data = CommonUtils.isUndefined(pagedTotalData.fieldRows[0][$scope.config.customModuleField].value) ? undefined :
            pagedTotalData.fieldRows[0][$scope.config.customModuleField].value[layer.value];
            $scope.config.moduleList.push({ 'title': layer.title, 'data': data })
          }
        });
        if (changeData) {
          changeDataOnBroadcast();
        }
        else {
          createFunnel();
        }
      })
    }

    function changeDataOnBroadcast(){
      for (let i = 0; i < $scope.config.layers.length; i++){

        var countDiv = document.getElementById($scope.config.wid+'layer-'+(i+1)+"-count");
        var dataIsNumberCheck = Number($scope.config.moduleList[i].data);

        if (isNaN(dataIsNumberCheck)) {
          countDiv.innerHTML = '?';
          countDiv.setAttribute("title", "Invalid Data");
          // countDiv.setAttribute("style", "color: red");
        }
        else {
          countDiv.innerHTML = $scope.config.moduleList[i].data;
        }

      }

    }

    //populate data for fsr modules
    function populateData() {
      var promises = [];
      $scope.config.layers.forEach((layer, index) => {
        var countAggregate = {
          alias: layer.value,
          field: '*',
          operator: 'count'
        };
        layer.query.aggregates = [countAggregate];
        layer.query.limit = ALL_RECORDS_SIZE;
        var _queryObj = new Query(layer.query);
        var promise = getResourceData(layer.value, _queryObj);
        promises.push(promise);
      });
      $q.all(promises).then(function (result) {
        $scope.config.moduleList = [];
        $scope.config.layers.forEach((layer, index) => {
          if (result[index] && result[index]['hydra:member'] && result[index]['hydra:member'].length > 0) {
            $scope.config.moduleList.push({ 'title': layer.title, 'data': result[index]['hydra:member'][0][layer.value] })
          }
        })
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
      var parentDiv = document.getElementById("funnelChartParentDiv" + $scope.config.wid)
      parentDiv.setAttribute('style', "position: relative; z-index: 1;padding-top:10px;")
      for (let i = 0; i < $scope.config.layers.length; i++) {

        //create divs for left taper,  right taper and center
        var funnel = document.createElement('div');
        var leftTaper = document.createElement('div');
        var centerTaper = document.createElement('div');
        var rightTaper = document.createElement('div');

                //set class
        funnel.setAttribute('class', 'position-relative funnelTop-' + ($scope.config.layers.length - i - 1));
        leftTaper.setAttribute('class', 'taper-left');
        centerTaper.setAttribute('class', 'taper-center cont');
        rightTaper.setAttribute('class', 'taper-right');

        // set colour for funnel
        leftTaper.setAttribute('style', 'border-color:' + $scope.color['layer' + (i + 1)] + ' transparent');
        rightTaper.setAttribute('style', 'border-color:' + $scope.color['layer' + (i + 1)] + ' transparent');
        centerTaper.setAttribute('style', 'background-color:' + $scope.color['layer' + (i + 1)] + '; width :' + width + 'px;');
        funnel.setAttribute("style", "margin-left:" + margin + 'px; z-index:' + ($scope.config.layers.length - i) + "; display:flex; margin-bottom:10px");

                //Change inner text 
        var innerTxt = document.createElement('div');
        innerTxt.innerHTML = $scope.config.moduleList[i].title;
        innerTxt.setAttribute('class', "inner-text")
        innerTxt.setAttribute('title', $scope.config.moduleList[i].title)

                //setting count to the perticular layer
        var count = document.createElement('div');
        count.setAttribute('id', $scope.config.wid + 'layer-' + (i + 1) + "-count")//set unique id to the element
        count.setAttribute('style', 'font-weight:bold;')
        var dataIsNumberCheck = Number($scope.config.moduleList[i].data);

        if (isNaN(dataIsNumberCheck)) {
          count.innerHTML = '?';
          count.setAttribute("title", "Invalid Data");
          // count.setAttribute("style", "color: red");
        }
        else {
          count.innerHTML = $scope.config.moduleList[i].data;
        }

        //append the child to parent div
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
