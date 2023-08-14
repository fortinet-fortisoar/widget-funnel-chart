'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('editFunnelChart102Ctrl', editFunnelChart102Ctrl);

  editFunnelChart102Ctrl.$inject = ['$scope', '$uibModalInstance', 'config', 'appModulesService', '_', 'Entity', 'modelMetadatasService'];

  function editFunnelChart102Ctrl($scope, $uibModalInstance, config, appModulesService, _, Entity, modelMetadatasService) {
    $scope.cancel = cancel;
    $scope.save = save;
    $scope.config = config;
    $scope.loadAttributesForCustomModule = loadAttributesForCustomModule;
    $scope.loadAttributes = loadAttributes;
    $scope.addLayer = addLayer;
    $scope.removeLayer = removeLayer;
    $scope.onChangedataSourceType = onChangedataSourceType;
    $scope.maxlayers = false;
    // List of modules containing atleast one JSON field
    $scope.jsonObjModuleList=[];
    $scope.layers = [];
    $scope.config.eventName = $scope.config.eventName ? $scope.config.eventName : "";
    $scope.config.broadcastEvent = $scope.config.broadcastEvent ? $scope.config.broadcastEvent : false;
    $scope.toggleAdvancedSettings = toggleAdvancedSettings;

    function init() {
      appModulesService.load(true).then(function (modules) {
        $scope.modules = modules;

        //Create a list of modules with atleast one JSON field
        modules.forEach((module, index) =>{
          var moduleMetaData = modelMetadatasService.getMetadataByModuleType(module.type);
          //change for loop to foreach
          for(let fieldIndex =0; fieldIndex < moduleMetaData.attributes.length; fieldIndex++){
            //Check If JSON field is present in the module
            if(moduleMetaData.attributes[fieldIndex].type === "object"){
              $scope.jsonObjModuleList.push(module);
              break;
            }
          }
        })
      })
      $scope.config.layers = $scope.config.layers ? $scope.config.layers : [{ value: undefined, title: '' }];
      if($scope.config.moduleType === 'Across Modules' && $scope.config.layers[0].value){
        $scope.config.layers.forEach(function(item, index){
          loadAttributes(index);
        })
      }
    }

    init();
    
    function toggleAdvancedSettings(){
      $scope.toggle = $scope.toggle === undefined ? true : !$scope.toggle;
    }

    function onChangedataSourceType() {
      delete $scope.config.query;
      delete $scope.config.customModuleField;
      delete $scope.config.customModule;
      $scope.maxlayers = false;
      $scope.config.layers = [];
      $scope.layers = [];
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
      $scope.layers[index] = {};
      $scope.layers[index].fields = [];
      $scope.layers[index].fieldsArray = [];
      var entity = new Entity($scope.config.layers[index].value);
      entity.loadFields().then(function () {
        $scope.layers[index].fields = entity.getFormFields();
        angular.extend($scope.layers[index].fields, entity.getRelationshipFields());
        $scope.layers[index].fieldsArray = entity.getFormFieldsArray();
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