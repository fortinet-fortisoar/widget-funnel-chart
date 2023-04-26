| [Home](../README.md) |
|---------------------------------------------|

# Usage

**Funnel Chart Widget Edit View**

**1. Data Source : Record containing JSON Data**

Select the "Record containing JSON Data" option if all the data to be rendered using JSON data of a certain field value of the module.

<img src="./media/custom-module.png" width=50%>


1. Select the data source(module) to fetch the data from.
2. Use the 'Filter', to filter out the record that contains the data.

    <img src="./media/filter-for-single-module.png" width=50%>


3. Select the field (the field must be of type json.)
    *Below is an example of how the field could be.*
    
    ```JSON 
    {
        "tam": 1000,
        "actual": 500,
        "possible": 800,
        "bToC": {
            "sale": 200
        }
    }
    ```
4. In the value section of the layer, mention the key for which the value is the data to be rendered. 
    eg. for the above json data, to render Actual and Sale's data populate the 'value' field as following

    <img src="./media/custom-module-layer.png" width=50%>



**Example of a Field and JSON Value**

![image](./media/custom-module-example.png)


**Widget**

This is how the data will be visible in the funnel

<img src="./media/custom-funnel.png" width=40%>



Note:  If the value of a given key is not numeric then by default '?' will be displayed and user will see an error "Invalid data" hover on.


**2. Data Source : Count of Records Across Module**

<img src="./media/fsr-modules.png" width=50%>

"Count of Records Across Module" option lets you select the multiple modules and it displays the count of records for each module based on the applied filters.

<img src="./media/funnel.png" width=40%>

**Note** : Maximum 4 layers can be added for any of the selected Datasets.