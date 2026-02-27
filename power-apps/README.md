# ScubaGear Analyzer — Power Apps Canvas App

Step-by-step build guide. Every click, every property, every formula.

**Starting point**: You have a blank canvas app (Tablet format) with Screen1
renamed to `scrUpload`, and the ScubaGear Analyzer custom connector added
as a data source.

---

## SCREEN 1: Upload & Summary (scrUpload)

---

### Step 1 — Add the Header Bar

1. Click **Insert** (top menu) → search **Rectangle** → click to add
2. Select the rectangle on the canvas. In the **Properties** panel (right side):
   - **X**: `0`
   - **Y**: `0`
   - **Width**: `1366`
   - **Height**: `60`
   - **Fill**: click the color → switch to the **Custom** tab → enter `RGBA(0, 120, 212, 1)`
3. Right-click the rectangle in the Tree view (left panel) → **Rename** → type `rectHeader`

### Step 2 — Add the Header Title

1. **Insert** → search **Text label** → click to add
2. Select the label. Set these properties (right panel + formula bar):
   - **Text**: `"ScubaGear Analyzer"`
   - **X**: `20`
   - **Y**: `10`
   - **Width**: `400`
   - **Height**: `40`
   - **Size**: `20`
   - **FontWeight**: `FontWeight.Bold`
   - **Color**: `RGBA(255, 255, 255, 1)`
3. Rename it to `lblTitle`

### Step 3 — Add the JSON Text Input

1. **Insert** → search **Text input** → click to add
2. Select it. Set properties:
   - **Mode**: in the Properties panel, change the dropdown from **Single line** to **Multi-line**
   - **X**: `20`
   - **Y**: `80`
   - **Width**: `660`
   - **Height**: `300`
   - **HintText**: `"Paste your ScubaGear TestResults.json content here..."`
   - **Size**: `11`
3. Rename it to `txtJsonInput`

### Step 4 — Add the Analyse Results Button

1. **Insert** → search **Button** → click to add
2. Select the button. Set properties:
   - **Text**: `"Analyse Results"`
   - **X**: `20`
   - **Y**: `390`
   - **Width**: `200`
   - **Height**: `40`
3. In the formula bar at the top, click the **property dropdown** (it probably says `OnSelect`) and make sure **OnSelect** is selected
4. Paste this formula into the formula bar:

```
Set(
    varResults,
    ScubaGearAnalyzerAPI.ParseResults(
        ParseJSON(txtJsonInput.Text)
    )
);
ClearCollect(colProducts, varResults.productBreakdown);
ClearCollect(colControls, varResults.controls);
Set(varChatContext, varResults.chatContext);
Set(varIsLoaded, true)
```

5. Rename it to `btnParse`

### Step 5 — Add the "Total" Summary Card

1. **Insert** → **Rectangle** → set properties:
   - **X**: `20`, **Y**: `450`, **Width**: `150`, **Height**: `90`
   - **Fill**: `RGBA(255, 255, 255, 1)`
   - **BorderColor**: `RGBA(211, 211, 211, 1)`
   - **BorderThickness**: `1`
   - Rename to `rectCardTotal`

2. **Insert** → **Text label** → set properties:
   - **Text**: `"Total"`
   - **X**: `30`, **Y**: `455`, **Width**: `130`, **Height**: `25`
   - **Size**: `12`, **Color**: `RGBA(0, 0, 139, 1)`
   - Rename to `lblCardTotalTitle`

3. **Insert** → **Text label** → set properties:
   - **Text**: `If(varIsLoaded, Text(varResults.summary.total), "—")`
   - **X**: `30`, **Y**: `480`, **Width**: `130`, **Height**: `50`
   - **Size**: `28`, **FontWeight**: `FontWeight.Bold`, **Color**: `RGBA(0, 0, 139, 1)`
   - Rename to `lblCardTotalValue`

### Step 6 — Add the "Pass" Summary Card

1. **Insert** → **Rectangle** → set properties:
   - **X**: `180`, **Y**: `450`, **Width**: `150`, **Height**: `90`
   - **Fill**: `RGBA(255, 255, 255, 1)`, **BorderColor**: `RGBA(211, 211, 211, 1)`, **BorderThickness**: `1`
   - Rename to `rectCardPass`

2. **Insert** → **Text label** → set:
   - **Text**: `"Pass"`
   - **X**: `190`, **Y**: `455`, **Width**: `130`, **Height**: `25`
   - **Size**: `12`, **Color**: `RGBA(16, 124, 16, 1)`
   - Rename to `lblCardPassTitle`

3. **Insert** → **Text label** → set:
   - **Text**: `If(varIsLoaded, Text(varResults.summary.pass), "—")`
   - **X**: `190`, **Y**: `480`, **Width**: `130`, **Height**: `50`
   - **Size**: `28`, **FontWeight**: `FontWeight.Bold`, **Color**: `RGBA(16, 124, 16, 1)`
   - Rename to `lblCardPassValue`

### Step 7 — Add the "Fail" Summary Card

1. **Insert** → **Rectangle** → set properties:
   - **X**: `340`, **Y**: `450`, **Width**: `150`, **Height**: `90`
   - **Fill**: `RGBA(255, 255, 255, 1)`, **BorderColor**: `RGBA(211, 211, 211, 1)`, **BorderThickness**: `1`
   - Rename to `rectCardFail`

2. **Insert** → **Text label** → set:
   - **Text**: `"Fail"`
   - **X**: `350`, **Y**: `455`, **Width**: `130`, **Height**: `25`
   - **Size**: `12`, **Color**: `RGBA(209, 52, 56, 1)`
   - Rename to `lblCardFailTitle`

3. **Insert** → **Text label** → set:
   - **Text**: `If(varIsLoaded, Text(varResults.summary.fail), "—")`
   - **X**: `350`, **Y**: `480`, **Width**: `130`, **Height**: `50`
   - **Size**: `28`, **FontWeight**: `FontWeight.Bold`, **Color**: `RGBA(209, 52, 56, 1)`
   - Rename to `lblCardFailValue`

### Step 8 — Add the "Manual" Summary Card

1. **Insert** → **Rectangle** → set properties:
   - **X**: `500`, **Y**: `450`, **Width**: `150`, **Height**: `90`
   - **Fill**: `RGBA(255, 255, 255, 1)`, **BorderColor**: `RGBA(211, 211, 211, 1)`, **BorderThickness**: `1`
   - Rename to `rectCardManual`

2. **Insert** → **Text label** → set:
   - **Text**: `"Manual"`
   - **X**: `510`, **Y**: `455`, **Width**: `130`, **Height**: `25`
   - **Size**: `12`, **Color**: `RGBA(255, 140, 0, 1)`
   - Rename to `lblCardManualTitle`

3. **Insert** → **Text label** → set:
   - **Text**: `If(varIsLoaded, Text(varResults.summary.manual), "—")`
   - **X**: `510`, **Y**: `480`, **Width**: `130`, **Height**: `50`
   - **Size**: `28`, **FontWeight**: `FontWeight.Bold`, **Color**: `RGBA(255, 140, 0, 1)`
   - Rename to `lblCardManualValue`

### Step 9 — Add the "Pass Rate" Card

1. **Insert** → **Rectangle** → set properties:
   - **X**: `660`, **Y**: `450`, **Width**: `150`, **Height**: `90`
   - **Fill**: `RGBA(255, 255, 255, 1)`, **BorderColor**: `RGBA(211, 211, 211, 1)`, **BorderThickness**: `1`
   - Rename to `rectCardRate`

2. **Insert** → **Text label** → set:
   - **Text**: `"Pass Rate"`
   - **X**: `670`, **Y**: `455`, **Width**: `130`, **Height**: `25`
   - **Size**: `12`, **Color**: `RGBA(0, 0, 139, 1)`
   - Rename to `lblCardRateTitle`

3. **Insert** → **Text label** → set:
   - **Text**: `If(varIsLoaded, Text(varResults.summary.overallPassRate) & "%", "—")`
   - **X**: `670`, **Y**: `480`, **Width**: `130`, **Height**: `50`
   - **Size**: `28`, **FontWeight**: `FontWeight.Bold`
   - **Color**: `If(varIsLoaded && varResults.summary.overallPassRate >= 80, RGBA(16, 124, 16, 1), RGBA(209, 52, 56, 1))`
   - Rename to `lblCardRateValue`

### Step 10 — Add the Overall Pass Rate Display

1. **Insert** → **Rectangle** → set properties:
   - **X**: `700`, **Y**: `80`, **Width**: `300`, **Height**: `300`
   - **Fill**: `RGBA(255, 255, 255, 1)`, **BorderColor**: `RGBA(211, 211, 211, 1)`, **BorderThickness**: `1`
   - Rename to `rectGauge`

2. **Insert** → **Text label** → set:
   - **Text**: `"Overall Pass Rate"`
   - **X**: `720`, **Y**: `100`, **Width**: `260`, **Height**: `30`
   - **Align**: `Align.Center`, **Size**: `14`
   - Rename to `lblGaugeTitle`

3. **Insert** → **Text label** → set:
   - **Text**: `If(varIsLoaded, Text(varResults.summary.overallPassRate) & "%", "—")`
   - **X**: `720`, **Y**: `160`, **Width**: `260`, **Height**: `80`
   - **Align**: `Align.Center`, **Size**: `48`, **FontWeight**: `FontWeight.Bold`
   - **Color**: `If(varIsLoaded && varResults.summary.overallPassRate >= 80, RGBA(16, 124, 16, 1), varIsLoaded && varResults.summary.overallPassRate >= 50, RGBA(255, 140, 0, 1), RGBA(209, 52, 56, 1))`
   - Rename to `lblGaugeValue`

4. **Insert** → **Text label** → set:
   - **Text**: `If(varIsLoaded, Text(varResults.summary.pass) & " of " & Text(varResults.summary.total) & " controls passing", "")`
   - **X**: `720`, **Y**: `250`, **Width**: `260`, **Height**: `30`
   - **Align**: `Align.Center`, **Size**: `12`, **Color**: `RGBA(169, 169, 169, 1)`
   - Rename to `lblGaugeSubtitle`

### Step 11 — Add the Product Breakdown Gallery

1. **Insert** → search **Blank vertical gallery** → click to add
2. Select the gallery. Set properties:
   - **Items**: `colProducts`
   - **X**: `20`, **Y**: `560`, **Width**: `800`, **Height**: `180`
   - **TemplateSize**: `60`
   - Rename to `galProducts`

3. Click **inside** the first row of the gallery (you're now editing the template)

4. **Insert** → **Text label** (inside the gallery template) → set:
   - **Text**: `ThisItem.displayName`
   - **X**: `10`, **Y**: `5`, **Width**: `250`, **Height**: `25`
   - **FontWeight**: `FontWeight.Bold`, **Size**: `13`

5. **Insert** → **Rectangle** (inside the gallery template) → set:
   - **X**: `270`, **Y**: `10`, **Height**: `20`
   - **Width**: `(ThisItem.passRate / 100) * 400`
   - **Fill**: `If(ThisItem.passRate >= 80, RGBA(16, 124, 16, 1), ThisItem.passRate >= 50, RGBA(255, 140, 0, 1), RGBA(209, 52, 56, 1))`

6. **Insert** → **Text label** (inside the gallery template) → set:
   - **Text**: `ThisItem.pass & " / " & ThisItem.total & " (" & ThisItem.passRate & "%)"  `
   - **X**: `270`, **Y**: `32`, **Width**: `300`, **Height**: `22`
   - **Size**: `11`, **Color**: `RGBA(169, 169, 169, 1)`

### Step 12 — Add Navigation Buttons

1. **Insert** → **Button** → set:
   - **Text**: `"Controls"`
   - **X**: `1050`, **Y**: `10`, **Width**: `140`, **Height**: `40`
   - **Fill**: `RGBA(0, 90, 158, 1)`
   - **Color**: `RGBA(255, 255, 255, 1)`
   - **OnSelect**: `Navigate(scrControls)`
   - Rename to `btnNavControls`

2. **Insert** → **Button** → set:
   - **Text**: `"Chat"`
   - **X**: `1200`, **Y**: `10`, **Width**: `140`, **Height**: `40`
   - **Fill**: `RGBA(0, 90, 158, 1)`
   - **Color**: `RGBA(255, 255, 255, 1)`
   - **OnSelect**: `Navigate(scrChat)`
   - Rename to `btnNavChat`

### Step 13 — SAVE

Press **Ctrl+S** to save.

---

## SCREEN 2: Controls Detail (scrControls)

---

### Step 14 — Create the Screen

1. In the Tree view (left panel), click the **+ New screen** button (or **Insert** → **New screen** → **Blank**)
2. A new screen appears. Right-click it in the Tree view → **Rename** → type `scrControls`

### Step 15 — Add the Header Bar

1. **Insert** → **Rectangle** → set:
   - **X**: `0`, **Y**: `0`, **Width**: `1366`, **Height**: `60`
   - **Fill**: `RGBA(0, 120, 212, 1)`
   - Rename to `rectHeader2`

2. **Insert** → **Text label** → set:
   - **Text**: `"Controls Detail"`
   - **X**: `20`, **Y**: `10`, **Width**: `300`, **Height**: `40`
   - **Size**: `20`, **FontWeight**: `FontWeight.Bold`, **Color**: `RGBA(255, 255, 255, 1)`

### Step 16 — Add Navigation Buttons

1. **Insert** → **Button** → set:
   - **Text**: `"Dashboard"`
   - **X**: `900`, **Y**: `10`, **Width**: `140`, **Height**: `40`
   - **Fill**: `RGBA(0, 90, 158, 1)`, **Color**: `RGBA(255, 255, 255, 1)`
   - **OnSelect**: `Navigate(scrUpload)`

2. **Insert** → **Button** → set:
   - **Text**: `"Chat"`
   - **X**: `1200`, **Y**: `10`, **Width**: `140`, **Height**: `40`
   - **Fill**: `RGBA(0, 90, 158, 1)`, **Color**: `RGBA(255, 255, 255, 1)`
   - **OnSelect**: `Navigate(scrChat)`

### Step 17 — Add the Product Filter Dropdown

1. **Insert** → search **Drop down** → click to add
2. Select it. Set properties:
   - **Items**: `["All", "AAD", "DEFENDER", "EXO", "SHAREPOINT", "TEAMS", "POWERPLATFORM", "POWERBI"]`
   - **X**: `20`, **Y**: `75`, **Width**: `200`, **Height**: `40`
   - **Default**: `"All"`
   - Rename to `drpProduct`

3. In the formula bar, select the **OnChange** property and paste:

```
Set(varSelectedProduct, Self.Selected.Value);
ClearCollect(
    colFilteredControls,
    Filter(
        colControls,
        (varSelectedProduct = "All" || product = varSelectedProduct) &&
        (varSelectedStatus = "All" || status = varSelectedStatus)
    )
)
```

### Step 18 — Add the Status Filter Dropdown

1. **Insert** → **Drop down** → set:
   - **Items**: `["All", "Pass", "Fail", "Not-Implemented", "3rd Party", "Omitted"]`
   - **X**: `240`, **Y**: `75`, **Width**: `200`, **Height**: `40`
   - **Default**: `"All"`
   - Rename to `drpStatus`

2. Set the **OnChange** property:

```
Set(varSelectedStatus, Self.Selected.Value);
ClearCollect(
    colFilteredControls,
    Filter(
        colControls,
        (varSelectedProduct = "All" || product = varSelectedProduct) &&
        (varSelectedStatus = "All" || status = varSelectedStatus)
    )
)
```

### Step 19 — Add the Count Label

1. **Insert** → **Text label** → set:
   - **Text**: `CountRows(colFilteredControls) & " controls"`
   - **X**: `460`, **Y**: `80`, **Width**: `200`, **Height**: `30`
   - **Size**: `13`, **Color**: `RGBA(169, 169, 169, 1)`

### Step 20 — Set Screen OnVisible

1. Click on the **scrControls** screen background (not on any control)
2. In the formula bar, select the **OnVisible** property and paste:

```
Set(varSelectedProduct, "All");
Set(varSelectedStatus, "All");
ClearCollect(colFilteredControls, colControls)
```

### Step 21 — Add the Controls Gallery

1. **Insert** → search **Blank vertical gallery** → click to add
2. Set properties:
   - **Items**: `SortByColumns(colFilteredControls, "controlId", SortOrder.Ascending)`
   - **X**: `20`, **Y**: `125`, **Width**: `850`, **Height**: `620`
   - **TemplateSize**: `90`
   - Rename to `galControls`

3. Click **inside** the first row of the gallery to edit the template

4. **Insert** → **Text label** (inside template) → set:
   - **Text**: `Switch(ThisItem.status, "Pass", "✅", "Fail", "❌", "Omitted", "⏭️", "Not-Implemented", "📋", "3rd Party", "🔗", "⚠️")`
   - **X**: `5`, **Y**: `5`, **Width**: `35`, **Height**: `35`
   - **Size**: `20`
   - Rename to `lblStatusIcon`

5. **Insert** → **Text label** (inside template) → set:
   - **Text**: `ThisItem.controlId`
   - **X**: `45`, **Y**: `5`, **Width**: `300`, **Height**: `25`
   - **Size**: `14`, **FontWeight**: `FontWeight.Bold`
   - Rename to `lblControlId`

6. **Insert** → **Text label** (inside template) → set:
   - **Text**: `ThisItem.criticality`
   - **X**: `350`, **Y**: `5`, **Width**: `100`, **Height**: `25`
   - **Size**: `12`
   - **Color**: `If(ThisItem.criticality = "SHALL", RGBA(209, 52, 56, 1), RGBA(255, 140, 0, 1))`
   - Rename to `lblCriticality`

7. **Insert** → **Text label** (inside template) → set:
   - **Text**: `ThisItem.status`
   - **X**: `460`, **Y**: `5`, **Width**: `120`, **Height**: `25`
   - **Size**: `12`
   - **Color**: `Switch(ThisItem.status, "Pass", RGBA(16, 124, 16, 1), "Fail", RGBA(209, 52, 56, 1), RGBA(128, 128, 128, 1))`
   - Rename to `lblStatus`

8. **Insert** → **Text label** (inside template) → set:
   - **Text**: `Left(ThisItem.reportDetails, 200)`
   - **X**: `45`, **Y**: `32`, **Width**: `750`, **Height**: `50`
   - **Size**: `11`, **Color**: `RGBA(169, 169, 169, 1)`
   - Rename to `lblDetails`

9. **Insert** → **Rectangle** (inside template) → set:
   - **X**: `0`, **Y**: `88`, **Width**: `850`, **Height**: `1`
   - **Fill**: `RGBA(211, 211, 211, 1)`

10. Set the **gallery template's OnSelect** (click the gallery, select **OnSelect** in the formula bar):
   - `Set(varSelectedControl, ThisItem); Set(varShowDetail, true)`

### Step 22 — Add the Detail Panel

1. **Insert** → **Rectangle** → set:
   - **X**: `880`, **Y**: `60`, **Width**: `486`, **Height**: `708`
   - **Fill**: `RGBA(255, 255, 255, 0.97)`
   - **BorderColor**: `RGBA(211, 211, 211, 1)`, **BorderThickness**: `1`
   - **Visible**: `varShowDetail`
   - Rename to `rectDetailPanel`

2. **Insert** → **Icon** → choose **Cancel** (X icon) → set:
   - **X**: `1330`, **Y**: `65`, **Width**: `30`, **Height**: `30`
   - **OnSelect**: `Set(varShowDetail, false)`
   - **Visible**: `varShowDetail`
   - **Color**: `RGBA(169, 169, 169, 1)`

3. **Insert** → **Text label** → set:
   - **Text**: `If(varShowDetail, Text(varSelectedControl.controlId), "")`
   - **X**: `895`, **Y**: `70`, **Width**: `400`, **Height**: `35`
   - **Size**: `20`, **FontWeight**: `FontWeight.Bold`
   - **Visible**: `varShowDetail`
   - Rename to `lblDetailId`

4. **Insert** → **Text label** → set:
   - **Text**: `If(varShowDetail, "Status: " & Text(varSelectedControl.status), "")`
   - **X**: `895`, **Y**: `110`, **Width**: `200`, **Height**: `25`
   - **Size**: `13`
   - **Color**: `Switch(Text(varSelectedControl.status), "Pass", RGBA(16, 124, 16, 1), "Fail", RGBA(209, 52, 56, 1), RGBA(128, 128, 128, 1))`
   - **Visible**: `varShowDetail`

5. **Insert** → **Text label** → set:
   - **Text**: `If(varShowDetail, "Criticality: " & Text(varSelectedControl.criticality), "")`
   - **X**: `895`, **Y**: `140`, **Width**: `200`, **Height**: `25`
   - **Size**: `13`
   - **Visible**: `varShowDetail`

6. **Insert** → **Text label** → set:
   - **Text**: `If(varShowDetail, Text(varSelectedControl.reportDetails), "")`
   - **X**: `895`, **Y**: `175`, **Width**: `450`, **Height**: `150`
   - **Size**: `12`, **Color**: `RGBA(169, 169, 169, 1)`
   - **Visible**: `varShowDetail`
   - Rename to `lblDetailReport`

7. **Insert** → **Button** → set:
   - **Text**: `"Get Remediation Steps"`
   - **X**: `895`, **Y**: `340`, **Width**: `220`, **Height**: `40`
   - **Fill**: `RGBA(0, 120, 212, 1)`, **Color**: `RGBA(255, 255, 255, 1)`
   - **Visible**: `varShowDetail`
   - **OnSelect**: `Set(varRemediation, ScubaGearAnalyzerAPI.GetRemediation(Text(varSelectedControl.controlId)))`
   - Rename to `btnRemediation`

8. **Insert** → search **HTML text** → set:
   - **HtmlText**: `If(!IsBlank(varRemediation), "<div style='overflow-y:auto;height:100%;font-size:11px;color:rgb(169,169,169);'>" & Substitute(Text(varRemediation.implementation), Char(10), "<br>") & "</div>", "")`
   - **X**: `895`, **Y**: `390`, **Width**: `450`, **Height**: `250`
   - **Visible**: `varShowDetail`
   - Rename to `htmlRemediation`

9. **Insert** → **Button** → set:
   - **Text**: `"View MS Learn Docs"`
   - **X**: `1130`, **Y**: `340`, **Width**: `220`, **Height**: `40`
   - **Fill**: `RGBA(16, 124, 16, 1)`, **Color**: `RGBA(255, 255, 255, 1)`
   - **Visible**: `varShowDetail`
   - **OnSelect**: `Set(varControlDocs, ScubaGearAnalyzerAPI.GetControlDocs(Text(varSelectedControl.controlId), false))`

10. **Insert** → **Text label** → set:
    - **Text**: `If(!IsBlank(varControlDocs), "MS Learn Docs (" & Text(varControlDocs.count) & " found):" & Char(10) & Concat(varControlDocs.urls, Value, Char(10)), "")`
    - **X**: `895`, **Y**: `650`, **Width**: `450`, **Height**: `100`
    - **Size**: `11`, **Color**: `RGBA(0, 120, 212, 1)`
    - **Visible**: `varShowDetail`
    - Rename to `lblDocs`

### Step 23 — SAVE

Press **Ctrl+S** to save.

---

## SCREEN 3: Chat (scrChat)

---

### Step 24 — Create the Screen

1. In the Tree view, click **+ New screen** → **Blank**
2. Right-click → **Rename** → `scrChat`

### Step 25 — Add the Header

1. **Insert** → **Rectangle** → set:
   - **X**: `0`, **Y**: `0`, **Width**: `1366`, **Height**: `60`
   - **Fill**: `RGBA(0, 120, 212, 1)`

2. **Insert** → **Text label** → set:
   - **Text**: `"AI Compliance Chat"`
   - **X**: `20`, **Y**: `10`, **Width**: `300`, **Height**: `40`
   - **Size**: `20`, **FontWeight**: `FontWeight.Bold`, **Color**: `RGBA(255, 255, 255, 1)`

### Step 26 — Add Navigation Buttons

1. **Insert** → **Button** → set:
   - **Text**: `"Dashboard"`
   - **X**: `900`, **Y**: `10`, **Width**: `140`, **Height**: `40`
   - **Fill**: `RGBA(0, 90, 158, 1)`, **Color**: `RGBA(255, 255, 255, 1)`
   - **OnSelect**: `Navigate(scrUpload)`

2. **Insert** → **Button** → set:
   - **Text**: `"Controls"`
   - **X**: `1050`, **Y**: `10`, **Width**: `140`, **Height**: `40`
   - **Fill**: `RGBA(0, 90, 158, 1)`, **Color**: `RGBA(255, 255, 255, 1)`
   - **OnSelect**: `Navigate(scrControls)`

### Step 27 — Add the Context Banner

1. **Insert** → **Text label** → set:
   - **Text**: `If(!IsBlank(varChatContext), "✅ Assessment data loaded — AI responses will reference your results.", "⚠️ No assessment loaded — go to Dashboard screen first and paste your JSON.")`
   - **X**: `20`, **Y**: `70`, **Width**: `1326`, **Height**: `35`
   - **Size**: `12`
   - **Fill**: `If(!IsBlank(varChatContext), RGBA(223, 246, 221, 1), RGBA(255, 244, 206, 1))`
   - **Align**: `Align.Center`

### Step 28 — Add the Chat History Gallery

1. **Insert** → **Blank vertical gallery** → set:
   - **Items**: `colChatHistory`
   - **X**: `100`, **Y**: `115`, **Width**: `1166`, **Height**: `560`
   - **TemplateSize**: `550`
   - In the formula bar, select the **Default** property from the dropdown and set it to: `Last(colChatHistory)`
   - Rename to `galChat`

2. Click inside the gallery template

3. **Insert** → search **HTML text** (inside template) → set:
   - **HtmlText**: `"<div style='overflow-y:auto;height:100%;font-size:12px;padding:8px 12px;border:1px solid rgb(211,211,211);background:" & If(Text(ThisItem.role) = "user", "rgb(220,248,198)", "rgb(255,255,255)") & ";'><b style='font-size:10px;color:rgb(169,169,169);'>" & If(Text(ThisItem.role) = "user", "You", "AI Assistant") & "</b><br>" & Substitute(Substitute(Text(ThisItem.content), "<", "&lt;"), Char(10), "<br>") & "</div>"`
   - **X**: `If(Text(ThisItem.role) = "user", 400, 10)`
   - **Y**: `5`
   - **Width**: `750`
   - **Height**: `If(Text(ThisItem.role) = "user", 110, Parent.TemplateHeight - 10)`
   - Rename to `htmlChatContent`

4. _(No separate role label needed — it's included in the HTML above)_

### Step 29 — Add the Message Input

1. **Insert** → **Text input** → set:
   - **Mode**: **Multi-line**
   - **X**: `100`, **Y**: `685`, **Width**: `1040`, **Height**: `60`
   - **HintText**: `"Ask about your ScubaGear results..."`
   - **Size**: `13`
   - Rename to `txtMessage`

### Step 30 — Add the Send Button

1. **Insert** → **Button** → set:
   - **Text**: `"Send"`
   - **X**: `1150`, **Y**: `685`, **Width**: `116`, **Height**: `60`
   - **Fill**: `RGBA(0, 120, 212, 1)`, **Color**: `RGBA(255, 255, 255, 1)`
   - **Size**: `14`
   - Rename to `btnSend`

2. Set the **OnSelect** property:

```
Collect(colChatHistory, {role: "user", content: txtMessage.Text});
Set(
    varChatResponse,
    ScubaGearAnalyzerAPI.Chat(
        ParseJSON(JSON({message: txtMessage.Text, assessmentContext: varChatContext}))
    )
);
Collect(colChatHistory, {role: "assistant", content: varChatResponse.response});
Reset(txtMessage)
```

### Step 31 — SAVE

Press **Ctrl+S** to save.

---

## TESTING

---

### Step 32 — Test the App

1. Press **F5** (or click the **Play** button ▶️ at the top right) to preview
2. You should see Screen 1 (Dashboard) with the JSON input area
3. Open `test-subset.json` from this repo, copy ALL the contents
4. Paste into the text input area
5. Click **Analyse Results**
6. You should see:
   - Pass Rate: **20%** (in red)
   - Total: **10**, Pass: **2**, Fail: **2**, Manual: **6**
   - Product breakdown: **Microsoft Entra ID** — 2/10 (20%)
7. Click **Controls** button in the header → navigate to Screen 2
8. You should see 10 controls listed with status icons
9. Click on a control → detail panel opens on the right
10. Click **Get Remediation Steps** → remediation text appears
11. Click **Chat** → navigate to Screen 3
12. Type: `Which controls failed?` → click **Send**
13. AI should respond referencing MS.AAD.7.3v1 and MS.AAD.3.4v1

### Step 33 — Publish

1. Press **Esc** to exit preview mode
2. **Ctrl+S** to save
3. Click **Publish** (top right) → **Publish this version**
4. Share with users in your org via **Share** button

---

## TROUBLESHOOTING

| Problem | Fix |
|---------|-----|
| "ScubaGearAnalyzerAPI" not found in formulas | Go to **Data** panel → **+ Add data** → search for your custom connector and add it. The connector name in formulas must match exactly. |
| Button does nothing when clicked | Check the **OnSelect** property is set (not the **Text** property). Click the property dropdown in the formula bar. |
| Gallery shows "No items" | Make sure you clicked **Analyse Results** first. The collections are empty until you parse JSON. |
| Remediation returns blank | The control ID may not be in the baseline data. Try MS.AAD.1.1v1 first. |
| Chat returns error | Check that the OPENAI_API_KEY is set on your Azure Function App. |
| varResults.summary.pass shows error | Wrap in `If(varIsLoaded, ..., "—")` to handle the unloaded state. |
