# PNF Widget
A vanilla JS widget to determine if an R&D claim requires prenotification to HMRC.

## Demo
![Demo](./assets/rnd-pnf-demo.gif)
## 🛠️ Installation & Deployment
To test the widget's functionality standalone:
### Requirements
* Node.js (v12+)
* npm (v6+)

### 🚀 Deployment
Execute the following command in your terminal when in the root directory of the project:
```bash
npm run start:dev
```
This will start a local server and open the widget in your default web browser.

## ⚙️Widget Configuration
The `PNFFlow` constructor accepts an options object to customise the IDs of the HTML elements it interacts with.

The default IDs for this project are:
| Purpose             | Default ID                |
| ------------------- | ------------------------- |
| Questions           | `question1` … `question5` |
| Result container    | `result`                  |
| Result text         | `pnfResult`               |
| Last-filing date    | `lastClaimFilingDate`     |
| Claim-period start  | `cpStartDate`             |
| Claim-period end    | `cpEndDate`               |
> See the `PNFFlowOptions` typedef in `flow.js` for details. 

## 🔌Integration
1. Add the CSS and JS files to your project.
2. Add the HTML structure to your page.
3. Create a new instance of the `PNFFlow` class, passing in the IDs of the HTML elements you want to use (Default or custom).
