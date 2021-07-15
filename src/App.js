//import logo from './logo.svg';
import './App.css';
import XLSX from "xlsx";
import pptxgen from "pptxgenjs";
import jsonData from './reports.json';
import analyticsData from './analytics.json';
import { jsPDF } from "jspdf";
import 'jspdf-autotable'
import html2canvas from 'html2canvas';
import React from 'react';
import Table from './Table';
import styled from 'styled-components'
import { useTable } from 'react-table'

const csvdata = jsonData.analyzeAnswerStat.stats;
const csat_answers = ["Very Dissatisfied","Dissatisfied","Neutral","Very satisfied","Excellent"]
const nps_answers = ["0","1","2","3","4","5","6","7","8","9","10"]
const editdata = (csvdataitem, data) =>{
  if(csvdataitem.reportType === "CSAT"  && data.length!== csat_answers.length )
  {
  let list = [];
  csat_answers.forEach(function(csat_answer, index) {
      const found = data.find(function(item) {
        return item.answer === csat_answer;
      }) || {};
      list.push({
        "answer": csat_answer,
        "score":found.score || index+1,
        "count":found.count || 0,
        "percentage":found.percentage || 0
      })
  })
  data = list
  }
  if(csvdataitem.reportType === "NPS"  && data.length!== nps_answers.length )
  {
      let list = [];
      delete data.answer;
      delete data.percentage;
      nps_answers.forEach(function(nps_answer, index) {
          const found = data.find(function(item) {
          return item.answer === nps_answer;
      }) || {};
      list.push({
        "score":found.score || index,
        "count":found.count || 0,
      })
  })
  data = list
}
data.sort((a, b) => (a.score > b.score) ? 1 : -1)
return data;
};

const exportEXCEL = () => {
  const wb = XLSX.utils.book_new(); // book
  for (let i = 0; i < csvdata.length; i++) {
    let data = csvdata[i].data;
    let survey_score = [];

    survey_score[i] = {"Total": csvdata[i].total, "Score" : csvdata[i].stat}
    data = editdata(csvdata[i],data);
    let fields = Object.keys(data[0]);
    //let newfields = fields.map(name => name.toUpperCase())
    let ws = XLSX.utils.json_to_sheet(data, { header: fields });
    
    if(csvdata[i].reportType !== "NPS"){
      XLSX.utils.sheet_add_aoa(ws, [["Total Count", csvdata[i].total]],  { origin: 'B7' });
    }
    if(csvdata[i] && csvdata[i].detractors !==null){
      XLSX.utils.sheet_add_aoa(ws, [["detractors", csvdata[i].detractors.percentage]],  { origin: { r: 2, c: 3 } });
      XLSX.utils.sheet_add_aoa(ws, [["passives", csvdata[i].passives.percentage]],  { origin: { r: 3, c: 3 } });
      XLSX.utils.sheet_add_aoa(ws, [["promoters", csvdata[i].promoters.percentage]],  { origin: { r: 4, c: 3 } });
      XLSX.utils.sheet_add_aoa(ws, [[csvdata[i].reportType, csvdata[i].stat]],  { origin: { r: 5, c: 3 } });
    }
    if(csvdata[i].reportType !== "GLOBAL" && csvdata[i].reportType !== "NPS")XLSX.utils.sheet_add_aoa(ws, [[csvdata[i].reportType, csvdata[i].stat]],  { origin: 'B8' });
    XLSX.utils.book_append_sheet(wb, ws, "question "+(i+1)); 
  }
  XLSX.writeFile(wb, jsonData.analyzeAnswerStat.title  + ".xlsx");
};

const exportPPT = () => {
  let pptx = new pptxgen();
  let indexOpts = {x: 1,	y: 0.3,	w: "70%",	h: 2.5,	fontSize: 48,	align: 'center', color: '010203'} 
  let quesOpts = {x: 1,	y: 0.3,	w: "70%",	h: 0.5,	fontSize: 18,	align: 'center', color: '010203'} 
  let surveytabOpts = {x:1.8, y:2.8, w:5.0, font_size:28, align: 'left', color:'010203',border: {type:'solid', color: '010203',pt:0.3 }}
  let tabheadOpts = { x:1.8, y:1.0, w:5.0, font_size:10, align: 'left', fill: { color:'d0d0d0' }, color:'010203',border: {type:'solid', color: '010203',pt:0.3 } }; //margin:0.1,fill:'F7F7F7',
  let tabOpts = { x:1.8, y:1.3, w:5.0, font_size:8, align: 'left', color:'010203',border: {type:'solid', color: '010203',pt:0.3 } }; //margin:0.1,fill:'F7F7F7',
  let piechartOptions = {
    x: 3.5,
    y: 2.0,
    w: "50%",
    h: 2.5,
    chartColors: [ "5FC4E3", "DE4216", "154384"],
    showTitle: false,
  }

  let barchartOptions = {
    x: 0.8,
    y: 3.0,
    w: "73%",
    h: 2.5,
    barDir: "col",
    chartColors: ["0077BF", "4E9D2D", "ECAA00", "5FC4E3", "DE4216", "154384"],
    showTitle: false,
    valAxes:[
      {
        showValAxisTitle: true,
        valAxisTitle: 'Percentage',
        valGridLine: 'none'
      }
    ]
    //showLegend: true
  }
  let indexslide = pptx.addSlide();
  indexslide.addText(jsonData.analyzeAnswerStat.title, indexOpts);
  let surveyData = [["Completed","Partial","Viewed","Not Viewed"],Object.values(jsonData.analyzeAnswerStat.statusSummary)]
  indexslide.addTable(surveyData, surveytabOpts);
  for (let i = 0; i < csvdata.length; i++) {
    let slide = pptx.addSlide();
    slide.addText(jsonData.analyzeAnswerStat.stats[i].question, quesOpts);

    let d = csvdata[i].data;
    d  = editdata(csvdata[i],d)
    let r1 = Object.keys(d[0])
    r1 = r1.map(name => name.toUpperCase());
    let rowheader = [r1];
    let rows = [], percentage =[], answers = [];
    
    d.forEach(function(item) {
      let arr = Object.keys(item).map((k) => item[k])
      rows.push(arr)
      percentage.push(item.percentage)
      answers.push(item.answer)
      return arr;
    });

    
    if(csvdata[i].reportType === "NPS" && csvdata[i].detractors !==null && csvdata[i].passives !==null && csvdata[i].promoters !==null ){
      answers = ["Detractors","Passives","Promoters"]
      percentage = [csvdata[i].detractors.percentage, csvdata[i].passives.percentage, csvdata[i].promoters.percentage ]
      tabheadOpts = { x:1.8, y:1.0, w:2.0, font_size:10, align: 'left', fill: { color:'d0d0d0' }, color:'010203',border: {type:'solid', color: '010203',pt:0.3 } }; //margin:0.1,fill:'F7F7F7',
      tabOpts = { x:1.8, y:1.3, w:2.0, h:2.0, font_size:8, align: 'left', color:'010203',border: {type:'solid', color: '010203',pt:0.3 } }; //margin:0.1,fill:'F7F7F7',
      let npstable = [answers,percentage]
      let npsOpts = { x:4.5, y:1.3, w:"30%", font_size:8, align: 'left', color:'010203',border: {type:'solid', color: '010203',pt:0.3 } };
      slide.addTable(npstable, npsOpts);
      let piechartData = [
        {
          name: "Question "+i,
          labels: answers,
          values: percentage,
        },
      ]
      slide.addChart(pptx.charts.PIE, piechartData, piechartOptions);
      } else {
        let barchartData = [
          {
            name: "Question "+i,
            labels: answers,
            values: percentage,
          },
        ]
        slide.addChart(pptx.charts.BAR, barchartData, barchartOptions);
    }
    slide.addTable(rowheader, tabheadOpts);
    slide.addTable(rows, tabOpts);
    let score = [[csvdata[i].reportType, "=", csvdata[i].stat]];
    if(csvdata[i].reportType && csvdata[i].reportType!== "GLOBAL" && csvdata[i].reportType!== "NPS")
    {
      let scoreOpts = { x:3.3, y:2.8, w:1.4, font_size:8, align: 'left', color:'010203'}
      slide.addTable(score, scoreOpts);
    } else if(csvdata[i].reportType === "NPS") {
      let scoreOpts = { x:1.8, y:4.5, w:1.4, font_size:8, align: 'left', color:'010203'}
      slide.addTable(score, scoreOpts);
    }
  }
  pptx.writeFile({ fileName: jsonData.analyzeAnswerStat.title + ".pptx" });

};

const exportPDF = () => {
  var doc = new jsPDF('p', 'pt' , 'a3');
  var childId = document.getElementById('content1');
  html2canvas(childId).then((canvas) => {
    
    for (let i = 0; i < csvdata.length; i++) {
      let d = csvdata[i].data;
      d  = editdata(csvdata[i],d)
      let r1 = Object.keys(d[0])
      r1 = r1.map(name => name.toUpperCase());
      let arr = []
      d.forEach(function(item) {
        arr.push(Object.values(item))
      });
      doc.text(jsonData.analyzeAnswerStat.stats[i].question, 30, 40);
      doc.autoTable({
        margin: { top: 50 , left:270},
        tableWidth: 'wrap',
        head: [r1],
        body: arr,
      })
      //let canvasDataURL = canvas.toDataURL("image/jpeg", 1.0);
      //doc.addImage(canvasDataURL, 'JPEG',15, 40, 180, 180)
      //doc.addImage(canvasDataURL, 'JPEG', 10, 50);
      doc.addPage()
    }
    doc.save("a4.pdf");
  });
}

const exportPDFv2 = async () => {
  var doc = new jsPDF('p', 'pt' , 'a3');
  let childern = document.getElementById('print').childNodes;
  let childIds = []

  childern.forEach(item => {
    if(item.id) childIds.push(item.id)
  });

  var i = 0;
  function nextStep(){
    if(i >= childIds.length) {
      doc.save("Reports.pdf");
      return;
    } 
    var childId = document.getElementById(childIds[i]);
    html2canvas(childId).then((canvas) => {
      let canvasDataURL = canvas.toDataURL("image/jpeg", 1.0);
      let width = canvas.width;
      let height = canvas.height;

      doc.addImage(canvasDataURL, 'JPEG', 10, 10, (width*.50), (height*.50) )
      //doc.addImage(canvasDataURL, 'JPEG', 10, 50);

      if( i < childIds.length){
        doc.addPage();
      }
      //doc.setPage(i+1);
      nextStep();
    })
    i++;
  }
  nextStep();
}
const Styles = styled.div`
  padding: 1rem;

  table {
    width: 300px;
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`
export default class App extends React.Component {
  constructor(props){
    super(props);
    this.state={
      tableData: analyticsData
    }
  }
  
  render () {
    return (
      <div className="App">
        <header className="App-header">
          <button onClick={exportEXCEL}>Export XLSX</button>
          <button onClick={exportPPT}>Export PPT</button>
          <button onClick={exportPDFv2}>Export PDF</button>
        </header>
        <Styles>
          <Table data={this.state.tableData}/>
        </Styles>
      </div>
    );
  }
}