import React from 'react';

export default class Table extends React.Component {
    
    constructor(props){
      super(props);
      this.getHeader = this.getHeader.bind(this);
      this.getRowsData = this.getRowsData.bind(this);
      this.getKeys = this.getKeys.bind(this);
      this.surveyNames = this.props.data[0].responseOverTimeStats.sourcesEn
      this.newData = this.props.data[0].responseOverTimeStats.chartData
      this.modified = []
        this.newData.map(d => {
            let a ={}
            a.date = d.interval
            this.modified.push(a)
            Object.keys(d).map(item => {
                this.surveyNames.find(obj => {
                    if(obj.value == item )
                    a[obj.name] = d[item]
                })
            })
        })
    }
    
    getKeys = function(){
        let keys = []
        this.modified.map(obj => {
            let key = Object.keys(obj)
            key.map(k => {
                if(keys.indexOf(k) == -1) keys.push(k)
            })
        })
        return keys;
    }
    
    getHeader = function(){
      var keys = this.getKeys();
      return keys.map((key, index)=>{
        return <th key={key}>{key.toUpperCase()}</th>
      })
    }
    
    getRowsData = function(){
      var items = this.modified;
      var keys = this.getKeys();
      return items.map((row, index)=>{
          console.log(row)
        return <tr key={index}><RenderRow key={index} data={row} keys={keys}/></tr>
      })
    }
    
    render() {
        return (
            <div>
                <table>
                    <thead>
                    <tr>{this.getHeader()}</tr>
                    </thead>
                    <tbody>
                    {this.getRowsData()}
                    </tbody>
                </table>
            </div>
            
        );
    }
}

const RenderRow = (props) =>{
  return props.keys.map((key, index)=>{
    return <td key={props.data[key]}>{props.data[key]}</td>
  })
}