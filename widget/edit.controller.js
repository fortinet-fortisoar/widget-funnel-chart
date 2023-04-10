'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('editFunnelChart101Ctrl', editFunnelChart101Ctrl);

  editFunnelChart101Ctrl.$inject = ['$scope', '$uibModalInstance', 'config', 'appModulesService', '_', 'CRUD_HUB', 'Entity', '$q'];

  function editFunnelChart101Ctrl($scope, $uibModalInstance, config, appModulesService, _, CRUD_HUB, Entity, $q) {
    $scope.cancel = cancel;
    $scope.save = save;
    $scope.config = config;
    $scope.loadAttributesForCustomModule = loadAttributesForCustomModule;
    $scope.loadAttributes = loadAttributes;
    $scope.addLayer = addLayer;
    $scope.removeLayer = removeLayer;
    $scope.onChangeModuleType = onChangeModuleType;
    $scope.maxlayers = false;
    $scope.customModuleList=[];

    $scope.funnelModuleType = {
      type: ['Across Modules', 'Single Module']
    }

    function init() {
      appModulesService.load(true).then(function (modules) {
        $scope.modules = modules;
        var moduleCheckPromise = [];

        modules.forEach((module, index) =>{
          var promise = checkJsonFieldInModule(module);
          moduleCheckPromise.push(promise);
        })
        $q.all(moduleCheckPromise).then(function(result){
          $scope.customModuleList = checkTrueFlag(result)
        })
      })
      $scope.config.layers = $scope.config.layers ? $scope.config.layers : [{ value: undefined, title: '' }];
    }

    //filter out modules with flag true
    function checkTrueFlag(modulesArray) {
      return modulesArray.filter(function(obj) {
        return obj['flag'];
      });
    }

    //For custom module, to flag json field containing module as true
    function checkJsonFieldInModule(module) {
      var entity = new Entity(module.type);
      var defer = $q.defer();
      return entity.loadFields().then(function () {
        for (var key in entity.fields) {
          //filtering out JSON fields 
          if (entity.fields[key].type === "object") {
            module.flag = true;
            break;
            }
        }
        if(!module.flag){
          module.flag = false
        }        
        defer.resolve(module)
        return defer.promise; 
      })
    }

    init();

    function onChangeModuleType() {
      delete $scope.config.query;
      delete $scope.config.customModuleField;
      delete $scope.config.customModule;
      $scope.maxlayers = false;
      $scope.config.layers = [];
      $scope.config.layers.push({ value: undefined, title: '' });
    }

    $scope.$watch('config.customModule', function (oldValue, newValue) {
      if ($scope.config.customModule && oldValue !== newValue) {
        if ($scope.config.query.filters) {
          delete $scope.config.query.filters;
        }
        delete $scope.config.customModuleField;
        $scope.loadAttributesForCustomModule();
      }
    });

    if ($scope.config.customModule) {
      $scope.loadAttributesForCustomModule();
    }

    function loadAttributesForCustomModule() {
      $scope.fields = [];
      $scope.fieldsArray = [];
      $scope.objectFields = [];
      var entity = new Entity($scope.config.customModule);
      entity.loadFields().then(function () {
        for (var key in entity.fields) {
          //filtering out JSON fields 
          if (entity.fields[key].type === "object") {
            $scope.objectFields.push(entity.fields[key]);
          }
        }
        $scope.fields = entity.getFormFields();
        angular.extend($scope.fields, entity.getRelationshipFields());
        $scope.fieldsArray = entity.getFormFieldsArray();
      });
    }

    function loadAttributes(index) {
      $scope.config.layers[index].fields = [];
      $scope.config.layers[index].fieldsArray = [];
      $scope.pickListFields = [];
      var entity = new Entity($scope.config.layers[index].value);
      entity.loadFields().then(function () {
        for (var key in entity.fields) {
          if (entity.fields[key].type === "picklist") {
            $scope.pickListFields.push(entity.fields[key]);
          }
        }
        $scope.config.layers[index].fields = entity.getFormFields();
        angular.extend($scope.config.layers[index].fields, entity.getRelationshipFields());
        $scope.config.layers[index].fieldsArray = entity.getFormFieldsArray();
      });
    }

    function addLayer() {
      if ($scope.config.layers.length < 4) {
        $scope.config.layers.push({
          value: undefined,
          title: ''
        });
      }
      else {
        $scope.maxlayers = true;
      }
    }
    function removeLayer(index) {
      $scope.maxlayers = false;
      if (index !== 0) {
        $scope.config.layers.splice(index, 1);
      }
    }

    function cancel() {
      $uibModalInstance.dismiss('cancel');
    }

    function save() {
      if ($scope.editFunnelWidgetForm.$invalid) {
        $scope.editFunnelWidgetForm.$setTouched();
        $scope.editFunnelWidgetForm.$focusOnFirstError();
        return;
      }
      $uibModalInstance.close($scope.config);
    }
  }
})();