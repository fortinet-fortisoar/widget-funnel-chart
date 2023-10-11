'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('funnelChart102Ctrl', funnelChart102Ctrl);

  funnelChart102Ctrl.$inject = ['$scope', 'Query', '$resource', '$q', 'API', 'PagedCollection', '$rootScope', 'CommonUtils'];

  function funnelChart102Ctrl($scope, Query, $resource, $q, API, PagedCollection, $rootScope, CommonUtils) {
    $scope.color = {
      layer1: '#0598A1',
      layer2: '#20B4BD',
      layer3: '#36CDD7',
      layer4: '#3ACAD3'
    }
    var _config = $scope.config;
    $scope.filterValidation = false;
    $scope.processing = false;
    
    __init()

    function __init() {
      //if this event is supposed to listen to eny of the broadcasted events
      if (_config.broadcastEvent) {
        //example widget:globalVisibilityEvent from Record Summary card
        $rootScope.$on("widget:"+_config.eventName, function (event, data) {
          eventReceived(data);
        })
      }
      if (_config.moduleType == 'Across Modules') { 
        populateData(); 
      }
      else {
        populateCustomData();
      }
    }


    function eventReceived(data){
      var element = document.getElementById("funnelChartParentDiv" + _config.wid);
      element.style.visibility = 'hidden';
      element.style.opacity = 0;
      $scope.processing = true;
      if (_config.moduleType == 'Single Module') {
        var defer = $q.defer();
        $resource(data).get(function (response) {
          defer.resolve(response);
        }, function (error) {
          defer.reject(error);
        })
        defer.promise.then(function (response) {
          formatDataForWidget(true, response[_config.customModuleField])
          $scope.processing = false;
          setTimeout(function () {
            element.style.visibility = 'visible';
            element.style.opacity = 1;
          }, 600);
        })
      }
    }

    //to populate funnel for custom module
    function populateCustomData() {
      var filters = {
        query: _config.query
      };
      var pagedTotalData = new PagedCollection(_config.customModule, null, null);
      pagedTotalData.loadByPost(filters).then(function () {
        if (pagedTotalData.fieldRows.length === 0) {
          $scope.filterValidation = true;
          return;
        }
        $scope.moduleList = [];
        var funnelChartData = pagedTotalData.fieldRows[0][_config.customModuleField].value;
        formatDataForWidget(false, funnelChartData);
      })
    }

    function formatDataForWidget(eventGenerated, funnelChartData) {
      //moduleList is the data in the format required by widget, which will be polulated in this function
      $scope.moduleList = [];
      _config.layers.forEach((layer, index) => {
        var nestedKeysArray = layer.value.split('.');
        if (nestedKeysArray.length > 1) {
          var data = funnelChartData;
          nestedKeysArray.forEach(function (value) {
            data = CommonUtils.isUndefined(data) ? undefined : data[value];
          })
          $scope.moduleList.push({ 'title': layer.title, 'data': data })
        }
        else {
          var data = CommonUtils.isUndefined(funnelChartData) ? undefined : funnelChartData[layer.value]
          $scope.moduleList.push({ 'title': layer.title, 'data': data })
        }
      });
      if (eventGenerated) {
        changeDataOnBroadcast()
      }
      else {
        createFunnel()
      }
    }

    function changeDataOnBroadcast() {
      //instead of reloading the entire widget this function just changes the inner html 
      for (let i = 0; i < _config.layers.length; i++) {
        var countDiv = document.getElementById(_config.wid + 'layer-' + (i + 1) + "-count");
        var dataIsNumberCheck = Number($scope.moduleList[i].data);
        if (isNaN(dataIsNumberCheck)) {
          countDiv.innerHTML = '?';
          countDiv.setAttribute("title", "Invalid Data");
        }
        else {
          countDiv.innerHTML = $scope.moduleList[i].data;
        }
      }
    }

    
    //populate data for fsr modules
    function populateData() {
      var promises = [];
      _config.layers.forEach((layer, index) => {
        layer.query.limit = 1;
        layer.query.aggregates = [{
          'operator': 'countdistinct',
          'field': '*',
          'alias': 'total'
      }]
        var _queryObj = new Query(layer.query);
        var promise = getResourceData(layer.value, _queryObj);
        promises.push(promise);
      });
      $q.all(promises).then(function (result) {
        $scope.moduleList = [];
        _config.layers.forEach((layer, index) => {
          if (result[index] && result[index]['hydra:member'] && result[index]['hydra:member'].length > 0) {
            $scope.moduleList.push({ 'title': layer.title, 'data': result[index]['hydra:member'][0].total })
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
      var width = 15 + (30 * (_config.layers.length + 3));
      var parentDiv = document.getElementById("funnelChartParentDiv" + _config.wid)
      parentDiv.setAttribute('style', "position: relative; z-index: 1;padding-top:8px; padding-left:25%")
      for (let i = 0; i < _config.layers.length; i++) {

        //create divs for left taper,  right taper and center
        var funnel = document.createElement('div');
        var leftTaper = document.createElement('div');
        var centerTaper = document.createElement('div');
        var rightTaper = document.createElement('div');

        //set class
        funnel.setAttribute('class', 'position-relative funnelTop-' + (_config.layers.length - i - 1));
        leftTaper.setAttribute('class', 'taper-left');
        centerTaper.setAttribute('class', 'taper-center cont');
        rightTaper.setAttribute('class', 'taper-right');

        // set colour for funnel
        leftTaper.setAttribute('style', 'border-color:' + $scope.color['layer' + (i + 1)] + ' transparent');
        rightTaper.setAttribute('style', 'border-color:' + $scope.color['layer' + (i + 1)] + ' transparent');
        centerTaper.setAttribute('style', 'background-color:' + $scope.color['layer' + (i + 1)] + '; width :' + width + 'px;');
        funnel.setAttribute("style", "margin-left:" + margin + 'px; z-index:' + (_config.layers.length - i) + "; display:flex; margin-bottom:10px");

        //Change inner text 
        var innerTxt = document.createElement('div');
        innerTxt.innerHTML = $scope.moduleList[i].title;
        innerTxt.setAttribute('class', "inner-text")
        innerTxt.setAttribute('title', $scope.moduleList[i].title)

        //setting count to the perticular layer
        var count = document.createElement('div');
        count.setAttribute('id', _config.wid + 'layer-' + (i + 1) + "-count")//set unique id to the element
        count.setAttribute('style', 'font-weight:bold;')
        var dataIsNumberCheck = Number($scope.moduleList[i].data);

        if (isNaN(dataIsNumberCheck)) {
          count.innerHTML = '?';
          count.setAttribute("title", "Invalid Data");
          // count.setAttribute("style", "color: red");
        }
        else {
          count.innerHTML = $scope.moduleList[i].data;
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
