# Plan de escenarios — sandbox BILLING

Fuente: Tooling API de BILLING, consultada el 2026-11-11/12 con `sf data query --use-tooling-api`. Lista de campos: `CustomField WHERE TableEnumOrId = 'Account'`. Dependientes: `MetadataComponentDependency WHERE RefMetadataComponentId IN (...)`, en lotes de 50 Ids (17 lotes, todos con menos de 2000 filas, así que ninguno se truncó).

- Campos personalizados de Account: **848** (80 de paquetes gestionados)
- Con 0 dependientes: **201** · con 1-10: **506** · con más de 10: **141**
- Flujos activos (`FlowDefinition WHERE ActiveVersionId != null`): **551**

## Elección

| Rol | Componente | Dependientes | Tipos |
|---|---|---|---|
| d0 | `Account.ITG_Plan_MRR_In_Number__c` | 0 | — |
| d1 | `Account.Preferred_Subdomain__c` | 5 | Layout 4, Flow 1 |
| d2 | `Account.Account_Status__c` | 26 | ApexClass 15, Layout 10, CustomField 1 |
| flujo | `Account_Transition_Status_Update` | 0 | — |

### d0 — `ITG_Plan_MRR_In_Number__c`

El preferido, `Account_MRR__c`, **no tiene 0 dependientes**: tiene 8 (Layout 7, CustomField 1), así que no sirve para d0.

Elegí `ITG_Plan_MRR_In_Number__c` (etiqueta "ITG Plan MRR In Number") porque:
- Tiene 0 dependientes en MetadataComponentDependency.
- Es de tipo Number y no es fórmula: un campo simple, como el preferido, y también de MRR.
- No pertenece a un paquete gestionado y está en el repo. En el índice local solo lo referencian su objeto, perfiles y permission sets, que MetadataComponentDependency no cuenta. Así que las dos fuentes coinciden.

### d1 — `Preferred_Subdomain__c` (5 dependientes)

Pediste que usara un flujo o un formulario de página. Ningún campo de 1-10 dependientes tiene un FlexiPage entre sus dependientes (MetadataComponentDependency no devolvió ninguna fila de tipo FlexiPage para campos de Account). Por eso tomé "formulario de página" como *page layout*. `Preferred_Subdomain__c` tiene a la vez un flujo y layouts:

  - Flow: `Set Preferred Subdomain Field in Account`
  - Layout: `End User Account Layout`
  - Layout: `Partner Account Layout`
  - Layout: `SalesOps End User Account Layout`
  - Layout: `System Admin End User Account Layout`

Es un campo Text que no es fórmula, no es de paquete gestionado y tiene texto de ayuda (la tarea 3 lo cambia). Su flujo dependiente no es el flujo elegido, así que los escenarios no se cruzan.
Nota para la tarea 8: borrar este campo debería fallar, o al menos avisar, porque un flujo lo referencia.

### d2 — `Account_Status__c` (26 dependientes)

Era el primero de los preferidos y tiene más de 10. La alternativa, `Account_Payment_Terms__c`, tiene 28 (Layout 10, Flow 9, ApexClass 6, CustomField 3). Me quedé con `Account_Status__c` porque estaba primero en tu lista y ambos cumplen el criterio.

  - ApexClass: `AssetRestController`
  - ApexClass: `CoverCodeUtilTest`
  - ApexClass: `ManualAccountSyncButtonControllerTest`
  - ApexClass: `NetSuiteZendeskUtility`
  - ApexClass: `NetSuiteZendeskUtilityTest`
  - ApexClass: `PEUtilityHelperExtensionTest`
  - ApexClass: `TestCloudUsageHistoryTrigger`
  - ApexClass: `TestDRaaSImplementationTracker`
  - ApexClass: `TestInstallCaseAutomation`
  - ApexClass: `TestLinkedAssetToAsset`
  - ApexClass: `TestOpportunityProductTrigger`
  - ApexClass: `TestRVMemberTrigger`
  - ApexClass: `TestSeedTracker`
  - ApexClass: `TestWarrantyTriggers`
  - ApexClass: `testOpportunityclone`
  - CustomField: `Zendesk_Acc_Sync_Criteria`
  - Layout: `Account Layout`
  - Layout: `End User Account Layout`
  - Layout: `End User Account Layout - Pricing Sync`
  - Layout: `ITG Account Layout`
  - Layout: `Partner Account Layout`
  - Layout: `Partner community Account Layout`
  - Layout: `SalesOps End User Account Layout`
  - Layout: `SalesOps Kaseya 365 End User Account Layout`
  - Layout: `Spanning Partner Layout`
  - Layout: `System Admin End User Account Layout`

### flujo — `Account_Transition_Status_Update`

**Limitación importante:** `MetadataComponentDependency WHERE RefMetadataComponentType = 'Flow'` devuelve **0 filas en toda la org**. Lo comprobé con un caso real: en el repo, `Account_Currency_Assignment_V2` llama a `Do_Nothing` como subflujo, pero MetadataComponentDependency no registra esa referencia (consultado por el Id de la definición, por el de la versión y desde la versión que llama). Por eso los 551 flujos activos dan 0 dependientes según esta API, y el criterio no sirve por sí solo para distinguirlos.

Para que el "0" sea creíble, crucé el resultado con el índice local del repo (`.claude/index/sfdx.db`), que sí detecta subflujos, acciones y botones. Elegí `Account_Transition_Status_Update` porque:
- Está activo en BILLING, no pertenece a un paquete gestionado y está en el repo.
- Nada lo referencia: 0 en MetadataComponentDependency y 0 aristas entrantes en el índice local, sin contar perfiles ni permission sets.
- Es un record-triggered flow (after save) sobre Account. Solo usa `Account_Transition_Status_Changed_On__c`, así que no toca d0, d1 ni d2.

## Retrieve

`sf project retrieve start --metadata CustomField:Account.ITG_Plan_MRR_In_Number__c CustomField:Account.Preferred_Subdomain__c CustomField:Account.Account_Status__c Flow:Account_Transition_Status_Update --target-org BILLING` → Succeeded. Los cuatro archivos ya existían en `unpackaged/main/default/`. La única diferencia con git es el fin de línea (LF de la org frente a CRLF); el contenido es idéntico.

## Todos los campos de Account y sus dependientes

Ordenados de más a menos dependientes. NS = prefijo de paquete gestionado.

| # | Campo | NS | Dependientes | Tipos |
|---|---|---|---|---|
| 1 | `Kaseya_Market_Segment__c` |  | 93 | ApexClass 69, Layout 9, CustomField 6, Flow 5, ValidationRule 2, WorkflowFieldUpdate 1, LightningComponentBundle 1 |
| 2 | `Annual_Contract_Value_ACV__c` |  | 91 | ApexClass 50, Flow 21, CustomField 12, Layout 7, WorkflowFieldUpdate 1 |
| 3 | `Customer_Segment_MSP_vs_MME__c` |  | 88 | ApexClass 44, Flow 17, Layout 9, EmailTemplate 7, CustomField 6, ApexPage 3, ValidationRule 1, LightningComponentBundle 1 |
| 4 | `account_email__c` |  | 86 | Flow 37, ApexClass 35, Layout 9, ValidationRule 3, EmailTemplate 2 |
| 5 | `Primary_Contact__c` |  | 82 | Flow 35, ApexClass 34, Layout 7, EmailTemplate 4, CustomField 1, ValidationRule 1 |
| 6 | `NetSuite_ID__c` |  | 77 | ApexClass 64, Layout 8, CustomField 2, Flow 2, ValidationRule 1 |
| 7 | `Sub_Type__c` |  | 69 | ApexClass 50, Layout 8, Flow 6, CustomField 3, ValidationRule 2 |
| 8 | `Reseller_Account__c` |  | 66 | ApexClass 40, CustomField 11, Layout 8, Flow 7 |
| 9 | `Account_Owner_Name__c` |  | 54 | Flow 30, EmailTemplate 9, ApexClass 7, CustomField 5, WorkflowFieldUpdate 2, LightningComponentBundle 1 |
| 10 | `Reseller_UUID__c` |  | 49 | ApexClass 30, Layout 7, Flow 5, CustomField 4, ValidationRule 2, WebLink 1 |
| 11 | `NetSuite_Customer_ID__c` |  | 45 | ApexClass 28, Layout 7, CustomField 5, Flow 3, EmailTemplate 2 |
| 12 | `Datto_External_ID__c` |  | 43 | Flow 18, Layout 8, EmailTemplate 8, ApexClass 6, CustomField 3 |
| 13 | `Renewal_Manager__c` |  | 43 | ApexClass 20, Flow 15, Layout 7, CustomField 1 |
| 14 | `Business_Unit__c` |  | 41 | ApexClass 23, Flow 8, Layout 6, CustomField 3, EmailTemplate 1 |
| 15 | `Number_of_Employees__c` |  | 41 | ApexClass 13, Flow 13, Layout 9, ApexPage 3, CustomField 2, LightningComponentBundle 1 |
| 16 | `Full_Account_ID__c` |  | 39 | EmailTemplate 13, Flow 8, Layout 7, CustomField 7, ApexClass 4 |
| 17 | `Account_Transition_Status__c` |  | 37 | Flow 17, ApexClass 12, Layout 5, CustomField 3 |
| 18 | `Auto_Renewal_Op_Out__c` |  | 36 | ApexClass 25, Layout 7, ValidationRule 3, Flow 1 |
| 19 | `Focused_Account__c` |  | 36 | ApexClass 20, Layout 10, CustomField 6 |
| 20 | `Account_Primary_Domain__c` |  | 35 | ApexClass 15, Layout 9, EmailTemplate 4, Flow 4, CustomField 2, ValidationRule 1 |
| 21 | `Bill_Reseller__c` |  | 35 | ApexClass 28, Layout 7 |
| 22 | `IT_Staff_Employees__c` |  | 35 | Flow 12, ApexClass 11, Layout 9, CustomField 1, ApexPage 1, LightningComponentBundle 1 |
| 23 | `Collections_Specialist__c` |  | 34 | Flow 19, Layout 7, EmailTemplate 3, CustomField 2, ApexClass 2, PlatformEventChannelMember 1 |
| 24 | `Financial_Standing__c` |  | 33 | Layout 7, CustomField 7, ApexClass 6, Flow 6, EmailTemplate 4, ApexPage 2, PlatformEventChannelMember 1 |
| 25 | `Geographic_Region__c` |  | 32 | ApexClass 14, CustomField 9, Layout 8, EmailTemplate 1 |
| 26 | `Total_Past_Due__c` |  | 31 | Flow 14, Layout 7, CustomField 6, ApexClass 3, EmailTemplate 1 |
| 27 | `Connection_Compliance_Date__c` |  | 30 | ApexClass 24, Layout 4, CustomField 2 |
| 28 | `Internal_Test_Account__c` |  | 29 | Layout 10, ApexClass 10, Flow 7, CustomField 2 |
| 29 | `Last_Probability_Update_Value__c` |  | 29 | ApexClass 27, Layout 2 |
| 30 | `MXN_Account_Type__c` |  | 29 | Flow 13, Layout 8, ApexClass 6, CustomField 2 |
| 31 | `Account_Payment_Terms__c` |  | 28 | Layout 10, Flow 9, ApexClass 6, CustomField 3 |
| 32 | `PSA_Internal_ID__c` |  | 27 | Layout 9, Flow 9, CustomField 4, ApexClass 2, ValidationRule 2, WebLink 1 |
| 33 | `Survey_Link_to_Zoom_Call__c` |  | 27 | ApexClass 16, Layout 7, Flow 4 |
| 34 | `Total_Balance__c` |  | 27 | Flow 14, Layout 10, CustomField 1, EmailTemplate 1, ApexClass 1 |
| 35 | `Account_Status__c` |  | 26 | ApexClass 15, Layout 10, CustomField 1 |
| 36 | `New_Connection_Compliance_Date__c` |  | 26 | Flow 9, ApexClass 8, Layout 5, CustomField 4 |
| 37 | `Datto_FP_Opt_in_Status__c` |  | 25 | Flow 13, Layout 7, ApexClass 3, CustomField 1, ValidationRule 1 |
| 38 | `Datto_SaaS_Opt_in_Status__c` |  | 25 | Flow 13, Layout 7, ApexClass 3, CustomField 1, ValidationRule 1 |
| 39 | `Datto_WP_Opt_in_Status__c` |  | 24 | Flow 13, Layout 7, ApexClass 2, CustomField 1, ValidationRule 1 |
| 40 | `KaseyaOne_Status__c` |  | 24 | Layout 8, ApexClass 6, CustomField 4, Flow 4, ApexPage 2 |
| 41 | `Primary_Executive_Contact__c` |  | 24 | ApexClass 8, Flow 8, Layout 7, ValidationRule 1 |
| 42 | `Annual_Recurring_Revenue_ARR__c` |  | 23 | ApexClass 13, Flow 7, ApexPage 2, CustomField 1 |
| 43 | `Next_Unstructured_Touchpoint_Due_By__c` |  | 23 | Flow 13, Layout 8, CustomField 1, ApexClass 1 |
| 44 | `Supported_by_Account__c` |  | 23 | ApexClass 9, Layout 8, CustomField 4, ValidationRule 1, Flow 1 |
| 45 | `Transition_Proof_Validation_By_Manager__c` |  | 23 | ApexClass 12, Layout 7, Flow 3, ValidationRule 1 |
| 46 | `Account_Verification_Status__c` |  | 22 | Layout 10, ApexClass 10, ValidationRule 1, Flow 1 |
| 47 | `Collection_Escalation_DO_NOT_SELL__c` |  | 22 | ApexClass 10, Layout 8, CustomField 4 |
| 48 | `Last_Unstructured_Touchpoint__c` |  | 22 | Flow 13, Layout 8, CustomField 1 |
| 49 | `RFT_FMIT_ID__c` |  | 22 | ApexClass 13, Layout 6, CustomField 3 |
| 50 | `SPNG_PO_Required__c` |  | 22 | ApexClass 10, Layout 7, Flow 4, CustomField 1 |
| 51 | `Datto_Owner_Name__c` |  | 21 | Layout 8, Flow 7, EmailTemplate 3, CustomField 2, ApexClass 1 |
| 52 | `Geographic_Sub_Region__c` |  | 21 | Flow 9, Layout 8, ApexClass 3, CustomField 1 |
| 53 | `Account_Owner_Email__c` |  | 20 | EmailTemplate 8, CustomField 4, ApexClass 4, Flow 3, WorkflowFieldUpdate 1 |
| 54 | `Last_Structured_Touchpoint__c` |  | 20 | Flow 9, Layout 8, ApexClass 2, CustomField 1 |
| 55 | `Collection_Status__c` |  | 19 | Layout 10, ApexClass 6, CustomField 3 |
| 56 | `CreditCardOnFile__c` |  | 19 | ApexClass 11, Layout 7, CustomField 1 |
| 57 | `IDA_Channel_Success_Manager__c` |  | 19 | Layout 8, Flow 6, CustomField 4, EmailTemplate 1 |
| 58 | `SPNG_VSA_Reseller_ID__c` |  | 19 | ApexClass 12, Layout 7 |
| 59 | `Billing_County__c` |  | 18 | Layout 10, Flow 5, ApexClass 3 |
| 60 | `Customer_Ops_Specialist__c` |  | 18 | Flow 13, Layout 5 |
| 61 | `Last_Compliant_Date__c` |  | 18 | Layout 7, Flow 6, CustomField 4, ApexClass 1 |
| 62 | `Next_Structured_Touchpoint_Due_By__c` |  | 18 | Layout 8, Flow 7, ApexClass 2, CustomField 1 |
| 63 | `Mulesoft_FP_Opt_in_Sync_Status__c` |  | 17 | Flow 11, Layout 4, ApexClass 2 |
| 64 | `Owner_AMA_AUM__c` |  | 17 | Flow 9, Layout 7, CustomField 1 |
| 65 | `Region__c` |  | 17 | Layout 9, CustomField 4, ApexClass 4 |
| 66 | `Meaningful_Relationship_Compliance__c` |  | 16 | Layout 7, ApexClass 5, CustomField 2, ApexPage 2 |
| 67 | `Mulesoft_SaaS_Opt_in_Sync_Status__c` |  | 16 | Flow 11, Layout 4, ApexClass 1 |
| 68 | `Mulesoft_WP_Opt_in_Sync_Status__c` |  | 16 | Flow 11, Layout 4, ApexClass 1 |
| 69 | `Override_Currency_Assignment__c` |  | 16 | Layout 8, Flow 5, ApexClass 3 |
| 70 | `Partner_Tier__c` |  | 16 | Layout 10, ApexClass 5, CustomField 1 |
| 71 | `Swimlanes_from_Subscriptions__c` |  | 16 | Layout 7, Flow 4, ApexClass 3, CustomField 1, EmailTemplate 1 |
| 72 | `TransitionCallCompleted__c` |  | 16 | ApexClass 10, Layout 6 |
| 73 | `Account_ACV_in_USD2__c` |  | 15 | ApexClass 6, CustomField 5, Flow 2, Layout 1, EmailTemplate 1 |
| 74 | `Account_URL__c` |  | 15 | Layout 6, EmailTemplate 6, Flow 2, CustomField 1 |
| 75 | `CSC_Representative__c` |  | 15 | Layout 15 |
| 76 | `IDA_Domain_Utilization__c` |  | 15 | Layout 10, ApexClass 4, CustomField 1 |
| 77 | `Kickback_Reason__c` |  | 15 | Layout 9, Flow 4, ApexClass 1, ValidationRule 1 |
| 78 | `Mulesoft_Account_Sync__c` |  | 15 | Flow 11, Layout 4 |
| 79 | `Product_Profile__c` |  | 15 | ApexClass 8, Layout 7 |
| 80 | `Swimlane_with_Opportunity_Owner__c` |  | 15 | Layout 7, ApexClass 5, Flow 2, EmailTemplate 1 |
| 81 | `Account_Owner_s_Profile__c` |  | 14 | Layout 7, Flow 4, ApexClass 3 |
| 82 | `CreditCardOnFile_Date__c` |  | 14 | Layout 7, ApexClass 7 |
| 83 | `Date_of_CSx_to_CSx_Account_Transfer__c` |  | 14 | Layout 7, Flow 3, CustomField 2, ApexClass 2 |
| 84 | `Kicked_back_to_NCA__c` |  | 14 | Layout 8, Flow 4, ApexClass 1, ValidationRule 1 |
| 85 | `NetSuite_Licensing_ID__c` |  | 14 | Layout 8, ApexClass 4, CustomField 2 |
| 86 | `Peer_Segment__c` |  | 14 | Layout 10, ApexClass 2, ApexPage 2 |
| 87 | `Previous_CSx_Rep__c` |  | 14 | Layout 7, Flow 3, EmailTemplate 2, ApexClass 2 |
| 88 | `VIP_Account__c` |  | 14 | Layout 7, ApexClass 6, CustomField 1 |
| 89 | `VSA_10_Upgrade_Ring__c` |  | 14 | Layout 9, ApexClass 4, CustomField 1 |
| 90 | `Agent_Utilization__c` |  | 13 | Layout 7, ApexClass 5, Flow 1 |
| 91 | `Custom_EULA__c` |  | 13 | Layout 10, ApexClass 3 |
| 92 | `Customer_Transition_Survey_Sent_On__c` |  | 13 | Layout 5, Flow 5, ApexClass 2, EmailTemplate 1 |
| 93 | `Is_TruMethods_Member__c` |  | 13 | Layout 10, Flow 3 |
| 94 | `IT_Landscape__c` |  | 13 | Layout 8, ApexClass 5 |
| 95 | `Legacy_ID_2__c` |  | 13 | Layout 10, ApexClass 3 |
| 96 | `Mulesoft_Account_Sync_Status__c` |  | 13 | Layout 7, Flow 6 |
| 97 | `Num_of_Open_Opportunities__c` |  | 13 | Layout 8, ApexClass 5 |
| 98 | `rvpe__RVAccount__c` | rvpe | 13 | Layout 7, ApexClass 4, CustomField 1, ValidationRule 1 |
| 99 | `Secure_Payments_Partner_Account__c` |  | 13 | Layout 7, Flow 4, ApexClass 2 |
| 100 | `Structured_Touchpoint__c` |  | 13 | Layout 8, ApexClass 4, CustomField 1 |
| 101 | `Sub_Region__c` |  | 13 | Layout 10, ApexClass 2, Flow 1 |
| 102 | `Survey_Customer_Transition_Sent_On__c` |  | 13 | ApexClass 8, Flow 4, EmailTemplate 1 |
| 103 | `Account_Owner_BU__c` |  | 12 | ApexClass 5, CustomField 4, Layout 3 |
| 104 | `Account_Owner_Manager_Name__c` |  | 12 | Flow 9, CustomField 2, WorkflowFieldUpdate 1 |
| 105 | `Affiliated_Resellers__c` |  | 12 | Layout 10, ApexClass 2 |
| 106 | `Customer_Transition_Contact__c` |  | 12 | Layout 5, EmailTemplate 4, Flow 2, CustomField 1 |
| 107 | `Datto_ARR_USD__c` |  | 12 | ApexClass 9, CustomField 3 |
| 108 | `Meaningful_Relationship_Event_Date__c` |  | 12 | Flow 5, ApexClass 4, CustomField 3 |
| 109 | `Most_Recent_Reseller__c` |  | 12 | Layout 7, ApexClass 3, CustomField 2 |
| 110 | `Num_Endpoints__c` |  | 12 | Layout 7, ApexClass 2, ApexPage 2, CustomField 1 |
| 111 | `Potentially_Strategic_Account_NCA__c` |  | 12 | Layout 10, CustomField 1, ApexClass 1 |
| 112 | `Prior_Account_Owner__c` |  | 12 | Layout 6, CustomField 2, EmailTemplate 2, ApexClass 2 |
| 113 | `Profit_Fuel_Customer__c` |  | 12 | Layout 10, ApexClass 2 |
| 114 | `PSA_Product_Health_Score__c` |  | 12 | Flow 10, CustomField 1, ApexClass 1 |
| 115 | `RMM_Product_Health_Score__c` |  | 12 | Flow 10, CustomField 1, ApexClass 1 |
| 116 | `Secure_Payments_Owner_Email__c` |  | 12 | Layout 6, Flow 4, ApexClass 2 |
| 117 | `Secure_Payments_Owner_Manager__c` |  | 12 | Layout 6, Flow 5, ApexClass 1 |
| 118 | `Survey_Customer_Transition_Contact__c` |  | 12 | Flow 7, ApexClass 4, EmailTemplate 1 |
| 119 | `Account_Sub_Segmentation__c` |  | 11 | Layout 8, Flow 2, CustomField 1 |
| 120 | `Account_Transition_Status_Changed_On__c` |  | 11 | Flow 6, Layout 5 |
| 121 | `AutoPay_Customer__c` |  | 11 | Layout 5, ApexClass 3, Flow 2, CustomField 1 |
| 122 | `Confirm_Box__c` |  | 11 | Layout 6, ValidationRule 3, ApexClass 2 |
| 123 | `Date_of_Final_Renewal__c` |  | 11 | Layout 10, CustomField 1 |
| 124 | `Datto_RMM_ID__c` |  | 11 | Layout 10, CustomField 1 |
| 125 | `IS_TMT__c` |  | 11 | Layout 10, CustomField 1 |
| 126 | `ITG_Contract_End_Date__c` |  | 11 | Layout 7, ApexClass 3, CustomField 1 |
| 127 | `ITG_Plan_Name__c` |  | 11 | Layout 9, ApexClass 2 |
| 128 | `ITG_Reseller__c` |  | 11 | Layout 7, CustomField 2, ApexClass 2 |
| 129 | `Last_Activity_Date__c` |  | 11 | Layout 6, ApexClass 5 |
| 130 | `Last_Hand_Raiser_Date__c` |  | 11 | Layout 7, Flow 3, ApexClass 1 |
| 131 | `Mxn_Account_Plan_Acknowledged__c` |  | 11 | ApexClass 7, CustomField 2, ApexPage 1, LightningComponentBundle 1 |
| 132 | `MyITP_ID__c` |  | 11 | Layout 10, CustomField 1 |
| 133 | `Num_Closed_Won_Opportunities__c` |  | 11 | Layout 8, ApexClass 2, EmailTemplate 1 |
| 134 | `SDR__c` |  | 11 | Layout 7, Flow 4 |
| 135 | `Secure_Payments_Owner_Manager_Email__c` |  | 11 | Layout 6, Flow 4, ApexClass 1 |
| 136 | `Secure_Payments_Owner_Name__c` |  | 11 | Layout 6, Flow 4, ApexClass 1 |
| 137 | `Spanning_Customer_ID__c` |  | 11 | Layout 10, ApexClass 1 |
| 138 | `Total_Assets_Expired_120_days_or_more__c` |  | 11 | Layout 10, CustomField 1 |
| 139 | `VIPeer_Account__c` |  | 11 | Layout 9, CustomField 2 |
| 140 | `VSAX_Customer__c` |  | 11 | Flow 6, ApexClass 5 |
| 141 | `Webroot_GSM_ID__c` |  | 11 | Layout 8, CustomField 2, ApexClass 1 |
| 142 | `Account_Type_Update__c` |  | 10 | Layout 10 |
| 143 | `Autotask_ID__c` |  | 10 | Layout 10 |
| 144 | `BAA__c` |  | 10 | Layout 10 |
| 145 | `Billing_Identified_Distributor__c` |  | 10 | Flow 9, Layout 1 |
| 146 | `Churn_Probability__c` |  | 10 | Layout 10 |
| 147 | `Connect_2022__c` |  | 10 | Layout 10 |
| 148 | `CSx_Territory__c` |  | 10 | Layout 8, CustomField 1, Flow 1 |
| 149 | `Custom_Incident_Notice_Period__c` |  | 10 | Layout 10 |
| 150 | `Customer_Tier__c` |  | 10 | Layout 8, CustomField 2 |
| 151 | `Datto_Admin_Portal__c` |  | 10 | Layout 10 |
| 152 | `Datto_Owner_Email__c` |  | 10 | Layout 8, EmailTemplate 2 |
| 153 | `Datto_Owner_Manager__c` |  | 10 | Layout 8, CustomField 2 |
| 154 | `Days_Since_Final_Renewal__c` |  | 10 | Layout 10 |
| 155 | `F1_Free_Trial_Status__c` |  | 10 | Layout 10 |
| 156 | `F1_Member_Status__c` |  | 10 | Layout 10 |
| 157 | `Finance_Approval_Required__c` |  | 10 | Layout 10 |
| 158 | `First_xSell_Product__c` |  | 10 | Layout 7, ApexClass 3 |
| 159 | `FormulaWon_Onboarding__c` |  | 10 | Layout 10 |
| 160 | `GDPR_Data_Processing_Agreement__c` |  | 10 | Layout 10 |
| 161 | `GTM_Account_Merger_Validation__c` |  | 10 | Layout 10 |
| 162 | `Implementation_Call__c` |  | 10 | Layout 10 |
| 163 | `Is_Fleet__c` |  | 10 | Layout 10 |
| 164 | `IT_Glue_Account_ID__c` |  | 10 | Layout 7, ApexClass 2, CustomField 1 |
| 165 | `IT_Glue_Product_Health_Score__c` |  | 10 | Flow 7, Layout 2, CustomField 1 |
| 166 | `ITG_AccountCurrencyIsoCode__c` |  | 10 | Layout 7, ApexClass 3 |
| 167 | `ITG_Region_Currency__c` |  | 10 | Layout 7, CustomField 3 |
| 168 | `Kaseya_365_Customer__c` |  | 10 | ApexClass 6, Layout 2, CustomField 1, Flow 1 |
| 169 | `Last_8_minutes_Call_Date__c` |  | 10 | Layout 9, WorkflowFieldUpdate 1 |
| 170 | `Last_Closed_Won_Opportunity_Date__c` |  | 10 | Layout 9, WorkflowFieldUpdate 1 |
| 171 | `Last_CSx_Rep_Reassignment_Call_Date__c` |  | 10 | Layout 7, Flow 2, CustomField 1 |
| 172 | `Legacy_System__c` |  | 10 | Layout 8, ApexClass 2 |
| 173 | `Link_to_Documents_Folder__c` |  | 10 | Layout 10 |
| 174 | `MSP_s_Monthly_Recurring_Revenue__c` |  | 10 | Layout 10 |
| 175 | `MSP_s_Non_Recurring_Revenue__c` |  | 10 | Layout 10 |
| 176 | `MSP_Type__c` |  | 10 | Layout 10 |
| 177 | `Next_Call_Scheduled__c` |  | 10 | Layout 10 |
| 178 | `NOC_Cadence__c` |  | 10 | Layout 8, Flow 2 |
| 179 | `Non_Disclosure_Agreement__c` |  | 10 | Layout 10 |
| 180 | `of_Clients__c` |  | 10 | Layout 10 |
| 181 | `Onboarding_Status__c` |  | 10 | Layout 10 |
| 182 | `PSA_H_Score__c` |  | 10 | Flow 9, CustomField 1 |
| 183 | `Renewal_Likelihood__c` |  | 10 | Layout 10 |
| 184 | `Request_Legal_Document__c` |  | 10 | Layout 10 |
| 185 | `Risk_Factors__c` |  | 10 | Layout 10 |
| 186 | `RMM_H_Score__c` |  | 10 | Flow 9, CustomField 1 |
| 187 | `Second_xSell_Product__c` |  | 10 | Layout 7, ApexClass 3 |
| 188 | `Security_Survey__c` |  | 10 | Layout 10 |
| 189 | `Skip_Auto_Provisioning__c` |  | 10 | Layout 7, ApexClass 3 |
| 190 | `Sole_Source__c` |  | 10 | Layout 10 |
| 191 | `Specialist_New_Customer_Team_Review_Note__c` |  | 10 | Layout 9, ValidationRule 1 |
| 192 | `Survey_Send_Survey_Count__c` |  | 10 | Flow 6, ApexClass 4 |
| 193 | `Target_Account__c` |  | 10 | Layout 8, CustomField 2 |
| 194 | `Tax_ID_Number__c` |  | 10 | Layout 10 |
| 195 | `Third_xSell_Product__c` |  | 10 | Layout 7, ApexClass 3 |
| 196 | `Total_Employees_on_WN__c` |  | 10 | Layout 10 |
| 197 | `Transformation_Surviving_Account_ID__c` |  | 10 | Layout 10 |
| 198 | `TruMethods_Success_Advisor__c` |  | 10 | Layout 10 |
| 199 | `Veeam_Pro__c` |  | 10 | Layout 8, CustomField 1, EmailTemplate 1 |
| 200 | `Xtra_Program_Status__c` |  | 10 | Layout 10 |
| 201 | `Years_In_Business__c` |  | 10 | Layout 10 |
| 202 | `Zendesk_Organization_Id__c` |  | 10 | Layout 6, ApexClass 4 |
| 203 | `AAOD_Tenant_URL__c` |  | 9 | Layout 8, CustomField 1 |
| 204 | `Account_ACV_USD__c` |  | 9 | Layout 3, ApexClass 3, ApexPage 2, WorkflowFieldUpdate 1 |
| 205 | `Accounting_Notes__c` |  | 9 | Layout 9 |
| 206 | `Assets_prod_on_Account__c` |  | 9 | Layout 6, ApexClass 2, EmailTemplate 1 |
| 207 | `AutoPay_Opt_Out__c` |  | 9 | Layout 5, ApexClass 2, Flow 2 |
| 208 | `Collector_Loss_Notes__c` |  | 9 | Layout 9 |
| 209 | `Connect_2021_del__c` |  | 9 | Layout 9 |
| 210 | `Connect_2023__c` |  | 9 | Layout 9 |
| 211 | `Credit_Last_Reviewed__c` |  | 9 | Layout 6, ApexClass 2, Flow 1 |
| 212 | `Credit_Limit__c` |  | 9 | Layout 6, ApexClass 2, Flow 1 |
| 213 | `Datto_Partner_Level__c` |  | 9 | Layout 5, ApexClass 2, ApexPage 2 |
| 214 | `Datto_Sync_Date__c` |  | 9 | Layout 8, ApexClass 1 |
| 215 | `DattoCon_Registered__c` |  | 9 | ApexClass 5, Layout 3, CustomField 1 |
| 216 | `Discount_Level__c` |  | 9 | Layout 6, CustomField 2, ApexClass 1 |
| 217 | `GAPPS_Auto_Renew__c` |  | 9 | Layout 7, ApexClass 2 |
| 218 | `IDA_Region__c` |  | 9 | Layout 6, ApexClass 3 |
| 219 | `IT_Glue_H_Score__c` |  | 9 | Flow 6, Layout 2, CustomField 1 |
| 220 | `IT_Glue_Health_Score__c` |  | 9 | Layout 9 |
| 221 | `ITG_Unlimited_ITG_Seats__c` |  | 9 | Layout 9 |
| 222 | `Kaseya_Region__c` |  | 9 | Layout 8, CustomField 1 |
| 223 | `List_of_Datto_Products__c` |  | 9 | Layout 8, ApexClass 1 |
| 224 | `MXN_Billing_TimeZone_Id__c` |  | 9 | ApexClass 9 |
| 225 | `MXN_Billing_TimeZone_Name__c` |  | 9 | ApexClass 9 |
| 226 | `NetSuite_Subsidiary_ID__c` |  | 9 | Layout 8, ApexClass 1 |
| 227 | `New_Connection_Compliance__c` |  | 9 | Layout 5, ApexClass 3, CustomField 1 |
| 228 | `New_Days_Until_Not_Connection_Compliant__c` |  | 9 | Layout 7, CustomField 1, ApexClass 1 |
| 229 | `NOC_Service_Delivery_Manager__c` |  | 9 | Layout 8, Flow 1 |
| 230 | `NOC_Service_Sub_Type__c` |  | 9 | Layout 8, Flow 1 |
| 231 | `NOC_Service_Type__c` |  | 9 | Layout 8, Flow 1 |
| 232 | `NS_Billing_Entity__c` |  | 9 | Layout 8, ValidationRule 1 |
| 233 | `Profit_Fuel_Opps__c` |  | 9 | Layout 8, CustomField 1 |
| 234 | `QA_Required__c` |  | 9 | Layout 9 |
| 235 | `RapidFire_Tools_Price__c` |  | 9 | Layout 9 |
| 236 | `RapidFire_Tools_Status__c` |  | 9 | Layout 9 |
| 237 | `Remarket_Remove_Reason__c` |  | 9 | Layout 9 |
| 238 | `SFDC_Auto_Renew__c` |  | 9 | Layout 7, ApexClass 2 |
| 239 | `SLA_Status__c` |  | 9 | Flow 6, ApexClass 3 |
| 240 | `Specialist_New_Customer_Team_Review__c` |  | 9 | Layout 8, ValidationRule 1 |
| 241 | `Transition_Survey_Responded__c` |  | 9 | Flow 6, ApexClass 3 |
| 242 | `Unstructured_TouchPoint__c` |  | 9 | Layout 8, ApexClass 1 |
| 243 | `Account_MRR__c` |  | 8 | Layout 7, CustomField 1 |
| 244 | `Account_Owner_Manager__c` |  | 8 | Flow 6, ApexClass 2 |
| 245 | `Account_Owner_s_Manager_Email__c` |  | 8 | Flow 5, CustomField 2, EmailTemplate 1 |
| 246 | `Acquirer__c` |  | 8 | Layout 7, LightningComponentBundle 1 |
| 247 | `Backup_Concierge__c` |  | 8 | Layout 7, Flow 1 |
| 248 | `BNG_Legacy_Id__c` |  | 8 | Layout 7, ApexClass 1 |
| 249 | `Boomi_Sync_Date_NS__c` |  | 8 | Layout 8 |
| 250 | `Boomi_Sync_Date_Zuora__c` |  | 8 | Layout 8 |
| 251 | `Business_Identity_Verification__c` |  | 8 | Layout 4, Flow 3, CustomField 1 |
| 252 | `Cadence_Periodocity__c` |  | 8 | Layout 6, Flow 2 |
| 253 | `Commisionable_User__c` |  | 8 | Layout 7, CustomField 1 |
| 254 | `CPQ_Pricebook_Used__c` |  | 8 | ApexClass 7, Layout 1 |
| 255 | `CSx_BoB__c` |  | 8 | Layout 8 |
| 256 | `Current__c` |  | 8 | Layout 7, ApexClass 1 |
| 257 | `Datto_Legacy_NetSuite_Id__c` |  | 8 | Layout 5, ApexClass 3 |
| 258 | `Datto_Owner_Manager_Email__c` |  | 8 | Layout 8 |
| 259 | `Datto_Owner_SF_ID__c` |  | 8 | Layout 8 |
| 260 | `Datto_Sync_Error__c` |  | 8 | Layout 8 |
| 261 | `Days_Allowed_CSx_Compliance_Tier__c` |  | 8 | CustomField 7, Layout 1 |
| 262 | `eComm__c` |  | 8 | Layout 8 |
| 263 | `Escalated_At_Risk_Account__c` |  | 8 | Layout 6, ValidationRule 2 |
| 264 | `IDA_Member_Organizations__c` |  | 8 | Layout 7, Flow 1 |
| 265 | `Incumbent_Solutions_Competitors__c` |  | 8 | Layout 8 |
| 266 | `IT_Landscapes__c` |  | 8 | ApexClass 7, Layout 1 |
| 267 | `ITG_Currency_Selector__c` |  | 8 | Layout 7, CustomField 1 |
| 268 | `Krow_Project_Completed__c` |  | 8 | Layout 6, Flow 2 |
| 269 | `Last_Provisioning_QA_Date__c` |  | 8 | Layout 7, CustomField 1 |
| 270 | `Legacy_ID__c` |  | 8 | Layout 8 |
| 271 | `Legacy_Owner__c` |  | 8 | Layout 8 |
| 272 | `New_CSx_Connection_Compliance_Day_Count__c` |  | 8 | Layout 5, CustomField 3 |
| 273 | `Next_Step__c` |  | 8 | Layout 8 |
| 274 | `NPS_NOC_Internal__c` |  | 8 | Layout 8 |
| 275 | `NS_Billing_Address_ID__c` |  | 8 | Layout 8 |
| 276 | `NS_Default_Billing_Address__c` |  | 8 | Layout 8 |
| 277 | `NS_Default_Shipping_Address__c` |  | 8 | Layout 8 |
| 278 | `Number_of_Open_Datto_Opps__c` |  | 8 | Layout 8 |
| 279 | `Open_Tickets_Compliance__c` |  | 8 | Flow 4, Layout 3, ApexClass 1 |
| 280 | `Order_Hold__c` |  | 8 | Layout 6, CustomField 1, ApexClass 1 |
| 281 | `Primary_Docusign_Reciepient_Email__c` |  | 8 | Layout 6, Flow 2 |
| 282 | `Reason_for_Escalation_At_Risk__c` |  | 8 | Layout 6, ValidationRule 2 |
| 283 | `SaaS_Infra_Discussion__c` |  | 8 | Layout 8 |
| 284 | `SBQQ__RenewalPricingMethod__c` | SBQQ | 8 | Layout 7, ApexClass 1 |
| 285 | `SPNG_Billing_Contact__c` |  | 8 | Layout 7, CustomField 1 |
| 286 | `SPNG_Billing_Method__c` |  | 8 | Layout 8 |
| 287 | `SPNG_MS_ID__c` |  | 8 | Layout 7, ApexClass 1 |
| 288 | `SPNG_Reseller_Tier__c` |  | 8 | Layout 7, CustomField 1 |
| 289 | `Subscription_Prod_on_Acc__c` |  | 8 | Layout 6, ApexClass 2 |
| 290 | `Success_Council__c` |  | 8 | Layout 8 |
| 291 | `Territory__c` |  | 8 | Layout 8 |
| 292 | `Total_Assets__c` |  | 8 | Layout 6, CustomField 2 |
| 293 | `Touchpoint_Exempt__c` |  | 8 | Layout 8 |
| 294 | `Transformation_Merger_Status__c` |  | 8 | Layout 8 |
| 295 | `UT_NCA_for_Resells__c` |  | 8 | Layout 6, CustomField 1, ApexClass 1 |
| 296 | `X365_Command_Customer__c` |  | 8 | Layout 8 |
| 297 | `Account_Health_Score__c` |  | 7 | Layout 7 |
| 298 | `Account_Health_Status__c` |  | 7 | Layout 7 |
| 299 | `Account_Transition_Survey_Name__c` |  | 7 | Flow 5, ApexClass 2 |
| 300 | `All_Assets_Expired_longer_than_120__c` |  | 7 | Layout 6, CustomField 1 |
| 301 | `AMA_vs_AUM__c` |  | 7 | ApexClass 4, Layout 3 |
| 302 | `BMS_Account_Name__c` |  | 7 | Layout 5, ApexClass 2 |
| 303 | `BNG_Partner_Account_Type__c` |  | 7 | Layout 7 |
| 304 | `Business_Days_Since_CSx_CSx_Transfer__c` |  | 7 | Layout 7 |
| 305 | `CSM_image_URL__c` |  | 7 | Layout 6, EmailTemplate 1 |
| 306 | `CSM_Phone__c` |  | 7 | Layout 6, EmailTemplate 1 |
| 307 | `CSx_Rep_Reassignment_Call_Pending__c` |  | 7 | Layout 7 |
| 308 | `Customer_Transition_Contact_Email__c` |  | 7 | Layout 6, CustomField 1 |
| 309 | `Default_Billing_Account__c` |  | 7 | Layout 6, CustomField 1 |
| 310 | `Domain_Users__c` |  | 7 | Layout 7 |
| 311 | `Employee_rewardspiffs_enabled__c` |  | 7 | Layout 6, CustomField 1 |
| 312 | `GApps_Domain_Name__c` |  | 7 | Layout 4, ApexClass 3 |
| 313 | `Goal_Assist1__c` |  | 7 | Layout 7 |
| 314 | `group_htg__c` |  | 7 | Layout 7 |
| 315 | `IDA_AM_Extension__c` |  | 7 | Layout 6, EmailTemplate 1 |
| 316 | `IDA_CSM_email__c` |  | 7 | Layout 6, EmailTemplate 1 |
| 317 | `IDA_meeting_Link__c` |  | 7 | Layout 6, EmailTemplate 1 |
| 318 | `IDA_Primary_Contact_DocuSignRecipient_ID__c` |  | 7 | Layout 6, ApexClass 1 |
| 319 | `IT_Glue_Account_Owner__c` |  | 7 | Layout 7 |
| 320 | `IT_Glue_Other_Pain_Point__c` |  | 7 | Layout 7 |
| 321 | `IT_Glue_Pain_Point__c` |  | 7 | Layout 7 |
| 322 | `IT_Glue_Subdomain__c` |  | 7 | Layout 7 |
| 323 | `ITG_Account_Status__c` |  | 7 | Layout 7 |
| 324 | `ITG_Account_Status_Date__c` |  | 7 | Layout 7 |
| 325 | `ITG_Api_Key_Generated__c` |  | 7 | Layout 7 |
| 326 | `ITG_Cancellation_Reason__c` |  | 7 | Layout 7 |
| 327 | `ITG_Chargify_Referral_Code__c` |  | 7 | Layout 7 |
| 328 | `ITG_Chargify_Subscription_ID__c` |  | 7 | Layout 7 |
| 329 | `ITG_Conversion_Date__c` |  | 7 | Layout 7 |
| 330 | `ITG_Coupon_Codes__c` |  | 7 | Layout 7 |
| 331 | `ITG_Max_MyGlue_Seats__c` |  | 7 | Layout 7 |
| 332 | `ITG_Max_Seats_Allowed__c` |  | 7 | Layout 7 |
| 333 | `ITG_min_licenses_required__c` |  | 7 | Layout 7 |
| 334 | `ITG_Min_MyGlue_Seats__c` |  | 7 | Layout 7 |
| 335 | `itg_minimum_seats__c` |  | 7 | Layout 7 |
| 336 | `ITG_Network_Glue_Status__c` |  | 7 | Layout 7 |
| 337 | `ITG_Network_Glue_Trial_End_Date__c` |  | 7 | Layout 7 |
| 338 | `ITG_Number_of_Documents__c` |  | 7 | Layout 7 |
| 339 | `ITG_Number_of_Flexible_Asset_Types__c` |  | 7 | Layout 7 |
| 340 | `ITG_Number_of_myGlue_Users__c` |  | 7 | Layout 7 |
| 341 | `ITG_Number_of_Notifications__c` |  | 7 | Layout 7 |
| 342 | `ITG_Number_of_Passwords__c` |  | 7 | Layout 7 |
| 343 | `ITG_Number_of_Users__c` |  | 7 | Layout 7 |
| 344 | `ITG_Onboarded_Date__c` |  | 7 | Layout 7 |
| 345 | `ITG_Plan_Extra_Seat_MRR__c` |  | 7 | Layout 7 |
| 346 | `ITG_Plan_MRR__c` |  | 7 | Layout 7 |
| 347 | `ITG_Potential_Seats__c` |  | 7 | Layout 7 |
| 348 | `ITG_PSA_Tool__c` |  | 7 | Layout 7 |
| 349 | `ITG_RMM_Tool__c` |  | 7 | Layout 7 |
| 350 | `ITG_Signup_MyGlue_Seats__c` |  | 7 | Layout 7 |
| 351 | `ITG_Signup_Referrer__c` |  | 7 | Layout 7 |
| 352 | `ITG_Signup_Source__c` |  | 7 | Layout 7 |
| 353 | `ITG_Signup_Unlimited_MyGlue__c` |  | 7 | Layout 7 |
| 354 | `ITG_Total_Coupon_Discount__c` |  | 7 | Layout 7 |
| 355 | `ITG_Trial_Expiration_Date__c` |  | 7 | Layout 7 |
| 356 | `ITGlue_lead_status__c` |  | 7 | Layout 7 |
| 357 | `License_Type__c` |  | 7 | Layout 6, CustomField 1 |
| 358 | `Meaningful_Relationship__c` |  | 7 | ApexClass 5, CustomField 1, Flow 1 |
| 359 | `Meaningful_Relationship_Compliant__c` |  | 7 | Layout 4, ApexClass 3 |
| 360 | `Mxn_Account_Plan_Acknowledged_Time__c` |  | 7 | ApexClass 5, ApexPage 1, LightningComponentBundle 1 |
| 361 | `MXN_Director__c` |  | 7 | Flow 7 |
| 362 | `MXN_Manager__c` |  | 7 | Flow 7 |
| 363 | `MXN_VP__c` |  | 7 | Flow 7 |
| 364 | `myITP_Unique_Id__c` |  | 7 | Layout 7 |
| 365 | `NetSuite_Customer_Tier_Group__c` |  | 7 | Layout 7 |
| 366 | `NetSuite_Last_Modified_Date__c` |  | 7 | Layout 7 |
| 367 | `Partner_requested_not_to_contact__c` |  | 7 | Layout 6, ApexClass 1 |
| 368 | `Provisioning_QA_Notes__c` |  | 7 | Layout 7 |
| 369 | `PSA_Health_Score__c` |  | 7 | Layout 7 |
| 370 | `Redistribution_Status__c` |  | 7 | Layout 7 |
| 371 | `Reseller_Account_Rollup_ACV__c` |  | 7 | Layout 7 |
| 372 | `RMM_Health_Score__c` |  | 7 | Layout 7 |
| 373 | `SBQQ__RenewalModel__c` | SBQQ | 7 | Layout 7 |
| 374 | `Spanning_COA_Cancelled__c` |  | 7 | Layout 7 |
| 375 | `SPNG_Billing_Frequency__c` |  | 7 | Layout 7 |
| 376 | `SPNG_Cancel_reason__c` |  | 7 | Layout 7 |
| 377 | `SPNG_Cancellation_Date__c` |  | 7 | Layout 7 |
| 378 | `SPNG_Cancellation_Reason__c` |  | 7 | Layout 7 |
| 379 | `SPNG_Ctvt_LegalSignatoryEmail__c` |  | 7 | Layout 7 |
| 380 | `SPNG_Customer_Cancelled__c` |  | 7 | Layout 7 |
| 381 | `SPNG_Logo_on_Website__c` |  | 7 | Layout 7 |
| 382 | `SPNG_Product__c` |  | 7 | Layout 7 |
| 383 | `SPNG_Reference_Contact__c` |  | 7 | Layout 7 |
| 384 | `SPNG_Relationship_Manager__c` |  | 7 | Layout 7 |
| 385 | `SPNG_Type_of_References__c` |  | 7 | Layout 7 |
| 386 | `SPNG_VSA_ID__c` |  | 7 | Layout 7 |
| 387 | `SPNG_VSA_Reseller_Console_Activation__c` |  | 7 | Layout 7 |
| 388 | `SPNG_VSA_Reseller_Console_Domain__c` |  | 7 | Layout 7 |
| 389 | `Total_AR_over_60_Days__c` |  | 7 | Layout 5, CustomField 2 |
| 390 | `TPP_Profile_Dynamic__c` |  | 7 | Layout 7 |
| 391 | `UT_Channel_Owner__c` |  | 7 | Layout 6, CustomField 1 |
| 392 | `VSA_Tier__c` |  | 7 | Layout 7 |
| 393 | `Active_Critical_Customer_Trackers__c` |  | 6 | Layout 6 |
| 394 | `Activity_Compliant__c` |  | 6 | Layout 6 |
| 395 | `Assets_Under_Paid_Support__c` |  | 6 | Layout 5, CustomField 1 |
| 396 | `C365_ACV__c` |  | 6 | Layout 6 |
| 397 | `Call_Compliant__c` |  | 6 | Layout 6 |
| 398 | `Commerce_Tenant__c` |  | 6 | Layout 6 |
| 399 | `Company_rewardspiffs_enabled__c` |  | 6 | Layout 6 |
| 400 | `Customer_Status__c` |  | 6 | Layout 5, ApexClass 1 |
| 401 | `Dark_Web_ID_Url__c` |  | 6 | Layout 6 |
| 402 | `Date_of_Churn__c` |  | 6 | Layout 2, CustomField 2, Flow 2 |
| 403 | `Date_of_Executive_Visit__c` |  | 6 | Layout 6 |
| 404 | `Date_of_First_Won_Opp__c` |  | 6 | ApexClass 5, CustomField 1 |
| 405 | `Datto_Child_Reseller_UUID__c` |  | 6 | Layout 4, CustomField 1, ValidationRule 1 |
| 406 | `DMR_Segment__c` |  | 6 | Layout 6 |
| 407 | `eComm_ACV__c` |  | 6 | Layout 6 |
| 408 | `Exec_Sponsor_Date_Last_Met_in_Person__c` |  | 6 | Layout 6 |
| 409 | `Exec_Sponsor_Date_Last_Spoken_w_Custom__c` |  | 6 | Layout 6 |
| 410 | `Exec_Sponsor_Tracking_notes__c` |  | 6 | Layout 6 |
| 411 | `Executive_Sponsor__c` |  | 6 | Layout 6 |
| 412 | `First_Endpoint_Range__c` |  | 6 | Layout 6 |
| 413 | `IDA_Account_Id__c` |  | 6 | Layout 6 |
| 414 | `IDA_Account_Migrated_Record__c` |  | 6 | Layout 6 |
| 415 | `IDA_Account_Migration_Id__c` |  | 6 | Layout 6 |
| 416 | `IDA_Facebook_Company_Page__c` |  | 6 | Layout 6 |
| 417 | `IDA_Legacy_Cancel_Reason_Detail__c` |  | 6 | Layout 6 |
| 418 | `IDA_Legacy_Date_Cancelled__c` |  | 6 | Layout 6 |
| 419 | `IDA_Legacy_Date_Customer_Onboarded__c` |  | 6 | Layout 6 |
| 420 | `IDA_Legacy_Date_Onboarding_Scheduled__c` |  | 6 | Layout 6 |
| 421 | `IDA_Legacy_Date_Provisioned__c` |  | 6 | Layout 6 |
| 422 | `IDA_Legacy_Partner_Onboard_Status__c` |  | 6 | Layout 6 |
| 423 | `IDA_LinkedIn_Company_Page__c` |  | 6 | Layout 6 |
| 424 | `IDA_Markets_Served__c` |  | 6 | Layout 6 |
| 425 | `IDA_Member_Org_Subgroup__c` |  | 6 | Layout 6 |
| 426 | `IDA_Twitter_Handle__c` |  | 6 | Layout 6 |
| 427 | `In_Rehab__c` |  | 6 | Layout 6 |
| 428 | `Is_Customer_Referenceable__c` |  | 6 | Layout 6 |
| 429 | `ITG_Company_Domain__c` |  | 6 | Layout 6 |
| 430 | `ITG_Last_Account_Activity__c` |  | 6 | Layout 6 |
| 431 | `ITG_Network_Glue_Price__c` |  | 6 | Layout 6 |
| 432 | `ITG_Onboarding_Start__c` |  | 6 | Layout 6 |
| 433 | `ITG_Onboarding_Type__c` |  | 6 | Layout 6 |
| 434 | `ITG_Plan_myGlue_MRR__c` |  | 6 | Layout 6 |
| 435 | `ITG_Total_MRR__c` |  | 6 | Layout 6 |
| 436 | `Kaseya_365_Customer_KO2__c` |  | 6 | Layout 3, ApexClass 3 |
| 437 | `Maintenance_Status__c` |  | 6 | Layout 6 |
| 438 | `Mxn_Account_Plan_Next_Due_Date__c` |  | 6 | ApexClass 6 |
| 439 | `Next_Monthly_NOC_Review_Call__c` |  | 6 | Layout 6 |
| 440 | `Next_New_Connection_Compliance_Date__c` |  | 6 | Layout 6 |
| 441 | `NOC_Health_Status__c` |  | 6 | Layout 6 |
| 442 | `NS_Shipping_Address_ID__c` |  | 6 | Layout 6 |
| 443 | `of_sales_employees__c` |  | 6 | Layout 6 |
| 444 | `of_SETechnical_employees__c` |  | 6 | Layout 6 |
| 445 | `Partner_Level__c` |  | 6 | Layout 6 |
| 446 | `Pax8_Agreement_Products__c` |  | 6 | Layout 6 |
| 447 | `Powered_service__c` |  | 6 | Layout 6 |
| 448 | `Referred_by__c` |  | 6 | Layout 6 |
| 449 | `Remediation_Plan__c` |  | 6 | Layout 6 |
| 450 | `Reseller__c` |  | 6 | Layout 3, ApexClass 3 |
| 451 | `Revive__c` |  | 6 | Layout 5, CustomField 1 |
| 452 | `RFT_Appliances_Status__c` |  | 6 | Layout 6 |
| 453 | `RFT_Support_Portal_View__c` |  | 6 | Layout 6 |
| 454 | `RMM_Tool__c` |  | 6 | Layout 4, EmailTemplate 2 |
| 455 | `SDM_Notes__c` |  | 6 | Layout 6 |
| 456 | `Secure_Payments_Start_Date__c` |  | 6 | Layout 6 |
| 457 | `Text_for_Refer_By_upon_Other_selected__c` |  | 6 | Layout 6 |
| 458 | `UT_Channel_Status__c` |  | 6 | Layout 6 |
| 459 | `Vorex_Customer__c` |  | 6 | Layout 6 |
| 460 | `Account_Transition_Process__c` |  | 5 | ApexClass 5 |
| 461 | `Acronis_Tenant_ID__c` |  | 5 | Layout 5 |
| 462 | `Business_Identity_Verified_Date__c` |  | 5 | Layout 4, Flow 1 |
| 463 | `CB_Account_Id__c` |  | 5 | Layout 5 |
| 464 | `CB_Active_Product__c` |  | 5 | Layout 5 |
| 465 | `datto_access_program_end_date__c` |  | 5 | Layout 4, CustomField 1 |
| 466 | `datto_access_program_extended__c` |  | 5 | Layout 4, CustomField 1 |
| 467 | `datto_access_program_started__c` |  | 5 | Layout 4, CustomField 1 |
| 468 | `ITG_Maximum_Seats__c` |  | 5 | Layout 5 |
| 469 | `Last_Account_Review__c` |  | 5 | Flow 4, Layout 1 |
| 470 | `Last_Score_Increase__c` |  | 5 | Flow 3, ApexClass 2 |
| 471 | `MS_Sync_Retry_Count__c` |  | 5 | ApexClass 5 |
| 472 | `Powered_Services__c` |  | 5 | CustomField 2, ApexClass 2, Layout 1 |
| 473 | `Preferred_Subdomain__c` |  | 5 | Layout 4, Flow 1 |
| 474 | `Previous_Owner_Email__c` |  | 5 | Flow 4, ApexClass 1 |
| 475 | `PSA_Tool__c` |  | 5 | Layout 3, EmailTemplate 2 |
| 476 | `Reseller_Account_Y_N__c` |  | 5 | Flow 5 |
| 477 | `RFT_Contact_Stage__c` |  | 5 | Layout 5 |
| 478 | `Spanning_Partner_Status__c` |  | 5 | Layout 3, ApexClass 2 |
| 479 | `Survey_Account_Transition_Confirmation__c` |  | 5 | ApexClass 5 |
| 480 | `Traverse_Cloud_URL__c` |  | 5 | Layout 5 |
| 481 | `VSA_Instance_URL__c` |  | 5 | Layout 5 |
| 482 | `VSAX_ID__c` |  | 5 | Layout 5 |
| 483 | `VSAX_Upgrade_Status__c` |  | 5 | Layout 5 |
| 484 | `VSAX_Upgrade_Status_Date__c` |  | 5 | Layout 5 |
| 485 | `Account_ACV__c` |  | 4 | Layout 3, WorkflowFieldUpdate 1 |
| 486 | `Account_Owner_s_Role__c` |  | 4 | WorkflowFieldUpdate 2, CustomField 1, ApexClass 1 |
| 487 | `Billing_Validation__c` |  | 4 | Flow 4 |
| 488 | `BNG_Owner_Rec_Id__c` |  | 4 | ApexClass 4 |
| 489 | `Boomi_Error__c` |  | 4 | Layout 4 |
| 490 | `Connection_Compliance__c` |  | 4 | Layout 4 |
| 491 | `custentity_customer_type__c` |  | 4 | Layout 4 |
| 492 | `DataCenter__c` |  | 4 | ApexClass 4 |
| 493 | `Datto_Distributor_Custom_Reseller_ID__c` |  | 4 | Layout 4 |
| 494 | `Datto_Partner_Level_Override__c` |  | 4 | Layout 4 |
| 495 | `Days_Until_Not_Connection_Compliant__c` |  | 4 | Layout 4 |
| 496 | `ExternalSignOff__c` |  | 4 | ApexClass 4 |
| 497 | `Field1__c` |  | 4 | Layout 4 |
| 498 | `ID_Agent_Price__c` |  | 4 | Layout 3, ApexClass 1 |
| 499 | `InstallId__c` |  | 4 | ApexClass 4 |
| 500 | `Is_MSP__c` |  | 4 | ApexClass 3, Layout 1 |
| 501 | `IT_Glue_prod_HS_Record_ID__c` |  | 4 | Layout 2, CustomField 1, Flow 1 |
| 502 | `Last_EBC__c` |  | 4 | Flow 3, CustomField 1 |
| 503 | `Last_IT_Complete__c` |  | 4 | Flow 4 |
| 504 | `Last_Pulsecheck__c` |  | 4 | Flow 4 |
| 505 | `Last_Technical_Account_Review__c` |  | 4 | Flow 4 |
| 506 | `Link_to_Zoom_Call__c` |  | 4 | ApexClass 3, Flow 1 |
| 507 | `MXN_Executive_Admin_Comment__c` |  | 4 | Layout 3, ApexClass 1 |
| 508 | `MXN_Spanning_Utilization__c` |  | 4 | ApexClass 3, CustomField 1 |
| 509 | `MXN_VSA_Utilization__c` |  | 4 | ApexClass 3, CustomField 1 |
| 510 | `Onboarding_Stage__c` |  | 4 | Layout 3, ApexClass 1 |
| 511 | `Partner_Contract_Start_Date__c` |  | 4 | Layout 4 |
| 512 | `Primary_Admin_Email__c` |  | 4 | Layout 4 |
| 513 | `SalesTerritory__c` |  | 4 | EmailTemplate 4 |
| 514 | `Shipping_Validation__c` |  | 4 | Flow 4 |
| 515 | `Spanning_Reference_Activity__c` |  | 4 | Layout 4 |
| 516 | `SPNG_Agreements__c` |  | 4 | Layout 4 |
| 517 | `SPNG_EMC__c` |  | 4 | Layout 3, ApexClass 1 |
| 518 | `SPNG_Geographic_Region__c` |  | 4 | Layout 3, CustomField 1 |
| 519 | `SPNG_Legacy_SF_ID__c` |  | 4 | Layout 3, ApexClass 1 |
| 520 | `Target_Partners__c` |  | 4 | Layout 3, CustomField 1 |
| 521 | `Website_Domain__c` |  | 4 | ApexClass 3, Flow 1 |
| 522 | `Boomi_Last_Modified_Date__c` |  | 3 | Layout 3 |
| 523 | `Churn_Reason__c` |  | 3 | Layout 3 |
| 524 | `Collections_Specialist_Email__c` |  | 3 | Flow 2, ApexClass 1 |
| 525 | `Connect_2019__c` |  | 3 | Layout 3 |
| 526 | `CSx_Connection_Compliance_Day_Count__c` |  | 3 | CustomField 2, Layout 1 |
| 527 | `Cust_Acquisition_Date__c` |  | 3 | CustomField 2, Layout 1 |
| 528 | `DattoNetSuite_Customer_InternalID__c` |  | 3 | ApexClass 2, Layout 1 |
| 529 | `Employee_Range__c` |  | 3 | CustomField 2, Layout 1 |
| 530 | `Exclude_Autopay_Language__c` |  | 3 | Layout 2, CustomField 1 |
| 531 | `Goal_Assist__c` |  | 3 | ApexClass 2, CustomField 1 |
| 532 | `Goal_Assist_Assets__c` |  | 3 | ApexClass 2, CustomField 1 |
| 533 | `ID_Agent_Status__c` |  | 3 | Layout 3 |
| 534 | `ITG_Sales_Region__c` |  | 3 | Layout 3 |
| 535 | `ITG_Signup_Network_Glue_Price__c` |  | 3 | Layout 3 |
| 536 | `Kaseya_365_Upgrade_Price__c` |  | 3 | Layout 3 |
| 537 | `KaseyaOne_Reseller_Opt_Out__c` |  | 3 | ApexClass 2, AuraDefinitionBundle 1 |
| 538 | `Last_Non_Boomi_Update_Date__c` |  | 3 | ApexClass 2, CustomField 1 |
| 539 | `MXN_Billing_Address_Change_Date__c` |  | 3 | ApexClass 3 |
| 540 | `Next_Renewal_Date__c` |  | 3 | ApexClass 3 |
| 541 | `NFR_Created_Date__c` |  | 3 | Layout 3 |
| 542 | `NFR_Seat_Count__c` |  | 3 | Layout 3 |
| 543 | `Owner_Phone__c` |  | 3 | Layout 2, CustomField 1 |
| 544 | `Partner_Success_Manager__c` |  | 3 | Layout 3 |
| 545 | `Plan__c` |  | 3 | Layout 3 |
| 546 | `Powered_Services_Assets__c` |  | 3 | ApexClass 2, CustomField 1 |
| 547 | `Purchased_List__c` |  | 3 | Layout 3 |
| 548 | `Region_Currency__c` |  | 3 | Layout 3 |
| 549 | `Risk_Level__c` |  | 3 | Layout 3 |
| 550 | `Rocket_Billing_ID__c` |  | 3 | Layout 3 |
| 551 | `Send_Survey_Count__c` |  | 3 | ApexClass 2, WorkflowFieldUpdate 1 |
| 552 | `Snowflake_Sync_Status__c` |  | 3 | Flow 3 |
| 553 | `Spanning_Legacy_ACV__c` |  | 3 | Layout 3 |
| 554 | `Spanning_Reference_Status__c` |  | 3 | Layout 3 |
| 555 | `Spanning_Reference_Status_Last_Changed__c` |  | 3 | Layout 3 |
| 556 | `SPNG_Billing_Contact_Email__c` |  | 3 | Layout 3 |
| 557 | `SPNG_Dell_Billing__c` |  | 3 | Layout 3 |
| 558 | `SPNG_Legacy_Account_Id__c` |  | 3 | Layout 3 |
| 559 | `SPNG_Payment_Term__c` |  | 3 | Layout 3 |
| 560 | `Technical_Account_Manager__c` |  | 3 | Layout 3 |
| 561 | `Company_Attribute_ZoomInfo__c` |  | 2 | ApexClass 2 |
| 562 | `CSx_Call_Compliance_Day_Count__c` |  | 2 | Layout 1, CustomField 1 |
| 563 | `Customer_due_to_Opportunity_ID__c` |  | 2 | ApexClass 2 |
| 564 | `Date_of_Last_Won_Opp__c` |  | 2 | Layout 1, CustomField 1 |
| 565 | `Days_Allowed_CSx_Call_Compliance_Tier__c` |  | 2 | Layout 1, CustomField 1 |
| 566 | `Domain__c` |  | 2 | Layout 2 |
| 567 | `General_Account_Information__c` |  | 2 | ApexClass 2 |
| 568 | `Health_Assessment_Customer__c` |  | 2 | Layout 1, ApexClass 1 |
| 569 | `IT_Landscape_Sum__c` |  | 2 | ApexClass 2 |
| 570 | `Latest_Opportunity_Created__c` |  | 2 | CustomField 1, WorkflowFieldUpdate 1 |
| 571 | `MXN_Provisioned__c` |  | 2 | CustomField 1, Flow 1 |
| 572 | `MXN_Usage__c` |  | 2 | CustomField 1, Flow 1 |
| 573 | `of_Open_Tasks__c` |  | 2 | ApexClass 2 |
| 574 | `Opportunities__c` |  | 2 | ApexClass 2 |
| 575 | `Owner_Title__c` |  | 2 | Layout 2 |
| 576 | `Previous_Owner_Role__c` |  | 2 | Flow 2 |
| 577 | `Primary_Contact_Name__c` |  | 2 | Flow 2 |
| 578 | `Primary_Distributor__c` |  | 2 | Layout 1, CustomField 1 |
| 579 | `PSA_Prod_HS_Record_ID__c` |  | 2 | CustomField 1, Flow 1 |
| 580 | `Reseller_Link__c` |  | 2 | Layout 2 |
| 581 | `RMM_Prod_HS_Record_ID__c` |  | 2 | CustomField 1, Flow 1 |
| 582 | `Survey_Count__c` |  | 2 | ApexClass 2 |
| 583 | `Zendesk_Acc_Sync_Criteria__c` |  | 2 | ApexClass 2 |
| 584 | `Account_Owner_Full_Id__c` |  | 1 | EmailTemplate 1 |
| 585 | `Account_Owner_Manager_Email_Hierarchy__c` |  | 1 | Flow 1 |
| 586 | `Account_Renewal_Date__c` |  | 1 | ApexClass 1 |
| 587 | `Active_CCD_Count__c` |  | 1 | CustomField 1 |
| 588 | `Attendance_Status__c` |  | 1 | ApexClass 1 |
| 589 | `Autotask_PSA_Y_N__c` |  | 1 | CustomField 1 |
| 590 | `BMS_Interest__c` |  | 1 | Layout 1 |
| 591 | `BNGBU__c` |  | 1 | ApexClass 1 |
| 592 | `Business_Unit_Account__c` |  | 1 | ApexClass 1 |
| 593 | `CIT_Form_Submitted__c` |  | 1 | ApexClass 1 |
| 594 | `CIT_Form_Submitted_On__c` |  | 1 | ApexClass 1 |
| 595 | `company_domain__c` |  | 1 | Layout 1 |
| 596 | `CSx_Activity_Compliance_Day_Count__c` |  | 1 | Layout 1 |
| 597 | `Customer_Champion__c` |  | 1 | Layout 1 |
| 598 | `Cyberhawk_Utilization__c` |  | 1 | ApexClass 1 |
| 599 | `Days_Allowed_CSx_Activity_Compliant_Tier__c` |  | 1 | Layout 1 |
| 600 | `DOZISF__ZoomInfo_First_Updated__c` | DOZISF | 1 | Flow 1 |
| 601 | `DOZISF__ZoomInfo_Id__c` | DOZISF | 1 | Flow 1 |
| 602 | `EndOfSurge__c` |  | 1 | CustomField 1 |
| 603 | `Events_Attended__c` |  | 1 | CustomField 1 |
| 604 | `Flagged_For__c` |  | 1 | CustomField 1 |
| 605 | `Gorgon_GSM__c` |  | 1 | ApexClass 1 |
| 606 | `Has_RocketCyber__c` |  | 1 | ApexClass 1 |
| 607 | `Health_Assessment_Rep__c` |  | 1 | Layout 1 |
| 608 | `Health_Score__c` |  | 1 | ApexClass 1 |
| 609 | `HighestSurgePercent__c` |  | 1 | CustomField 1 |
| 610 | `Install_Product__c` |  | 1 | ApexClass 1 |
| 611 | `Intentional_Duplicate__c` |  | 1 | Layout 1 |
| 612 | `ITG_Legacy_Country__c` |  | 1 | Layout 1 |
| 613 | `ITG_Legacy_State__c` |  | 1 | Layout 1 |
| 614 | `ITG_Network_Glue_Price_New__c` |  | 1 | Layout 1 |
| 615 | `ITG_Plan_myGlue_MRR_In_Number__c` |  | 1 | CustomField 1 |
| 616 | `ITG_Plan_myGlue_MRR_New__c` |  | 1 | Layout 1 |
| 617 | `ITG_Total_MRR_In_Number__c` |  | 1 | CustomField 1 |
| 618 | `ITG_Total_MRR_New__c` |  | 1 | Layout 1 |
| 619 | `Kaseya_Owned_Account__c` |  | 1 | ApexClass 1 |
| 620 | `Last_Compliant_Date_Time__c` |  | 1 | ApexClass 1 |
| 621 | `Last_Date_lost__c` |  | 1 | ApexClass 1 |
| 622 | `MRR__c` |  | 1 | CustomField 1 |
| 623 | `Mulesoft_Integration_Message__c` |  | 1 | Layout 1 |
| 624 | `Mxn_Account_Plan_AcknowledgedBy__c` |  | 1 | LightningComponentBundle 1 |
| 625 | `MXN_Call_Counter_Since_Compliance__c` |  | 1 | ApexClass 1 |
| 626 | `MXN_Owner_Sip_Flag__c` |  | 1 | ApexClass 1 |
| 627 | `Network_Glue_Price_In_Number__c` |  | 1 | CustomField 1 |
| 628 | `Number_of_Sales_Staff__c` |  | 1 | Layout 1 |
| 629 | `Number_of_Systems_Engineers__c` |  | 1 | Layout 1 |
| 630 | `Partner_s_First_Deal__c` |  | 1 | Layout 1 |
| 631 | `Partner_s_First_Deal_Amount__c` |  | 1 | Layout 1 |
| 632 | `Partner_s_First_PQL__c` |  | 1 | Layout 1 |
| 633 | `Renewal_Specialist_Email__c` |  | 1 | ApexClass 1 |
| 634 | `Reseller_Account_Type_Customer__c` |  | 1 | ApexClass 1 |
| 635 | `SBQQ__PreserveBundle__c` | SBQQ | 1 | Layout 1 |
| 636 | `Spanning_GSuite_Utilization__c` |  | 1 | CustomField 1 |
| 637 | `Spanning_O365_Utilization__c` |  | 1 | CustomField 1 |
| 638 | `Spanning_SFDC_Utilization__c` |  | 1 | CustomField 1 |
| 639 | `SPNG_DE_Hostname__c` |  | 1 | Flow 1 |
| 640 | `Test_Amount__c` |  | 1 | CustomField 1 |
| 641 | `Traverse_Interest__c` |  | 1 | Layout 1 |
| 642 | `Trigger_Legal_Doc_Button_Support_Hidden__c` |  | 1 | Flow 1 |
| 643 | `Trigger_Legal_Documents_Support_1_Button__c` |  | 1 | Flow 1 |
| 644 | `UEB_Actual_Expire_Date__c` |  | 1 | CustomField 1 |
| 645 | `Vorex_interest__c` |  | 1 | Layout 1 |
| 646 | `VSA_Agent_Utilization__c` |  | 1 | ApexClass 1 |
| 647 | `x365_Command_Interest__c` |  | 1 | Layout 1 |
| 648 | `Account_Owner_Is_Active__c` |  | 0 |  |
| 649 | `Account_Subtype__c` |  | 0 |  |
| 650 | `Account_Transition_Completed__c` |  | 0 |  |
| 651 | `Account_Transition_Confirmation__c` |  | 0 |  |
| 652 | `Account_Transition_Pending__c` |  | 0 |  |
| 653 | `ACV_in_USD_New__c` |  | 0 |  |
| 654 | `AdClicksRolling30__c` |  | 0 |  |
| 655 | `AdClicksRolling90__c` |  | 0 |  |
| 656 | `AdDataUpToDateAsOf__c` |  | 0 |  |
| 657 | `AdImpressionsRolling30__c` |  | 0 |  |
| 658 | `AdImpressionsRolling90__c` |  | 0 |  |
| 659 | `adroll__Click_Conversion__c` | adroll | 0 |  |
| 660 | `adroll__ClickConversion__c` | adroll | 0 |  |
| 661 | `adroll__ClickCosts__c` | adroll | 0 |  |
| 662 | `adroll__Clicks__c` | adroll | 0 |  |
| 663 | `adroll__ImpressionCosts__c` | adroll | 0 |  |
| 664 | `adroll__Impressions__c` | adroll | 0 |  |
| 665 | `adroll__Impressions_External_ID__c` | adroll | 0 |  |
| 666 | `adroll__LastAdRollTrackingDate__c` | adroll | 0 |  |
| 667 | `adroll__Page_Views__c` | adroll | 0 |  |
| 668 | `adroll__RollWorks_Sourced__c` | adroll | 0 |  |
| 669 | `adroll__View_Conversion__c` | adroll | 0 |  |
| 670 | `adroll__ViewConversion__c` | adroll | 0 |  |
| 671 | `Area_Code_Time_Zone__c` |  | 0 |  |
| 672 | `ARR__c` |  | 0 |  |
| 673 | `AssociatedTerminusAccounts__c` |  | 0 |  |
| 674 | `AssociatedTerminusAccountsUpToDateAsOf__c` |  | 0 |  |
| 675 | `AuthAnvil_Interest__c` |  | 0 |  |
| 676 | `Billing_Contact_Needed__c` |  | 0 |  |
| 677 | `Boomerang_Tier__c` |  | 0 |  |
| 678 | `Business_Days_Since_Compliant_Activity__c` |  | 0 |  |
| 679 | `Business_Days_Since_Last_Activity__c` |  | 0 |  |
| 680 | `chargify_referral_code__c` |  | 0 |  |
| 681 | `Churned_Count__c` |  | 0 |  |
| 682 | `CloudingoAgent__BAR__c` | CloudingoAgent | 0 |  |
| 683 | `CloudingoAgent__BAS__c` | CloudingoAgent | 0 |  |
| 684 | `CloudingoAgent__BAV__c` | CloudingoAgent | 0 |  |
| 685 | `CloudingoAgent__BRDI__c` | CloudingoAgent | 0 |  |
| 686 | `CloudingoAgent__BTZ__c` | CloudingoAgent | 0 |  |
| 687 | `CloudingoAgent__SAR__c` | CloudingoAgent | 0 |  |
| 688 | `CloudingoAgent__SAS__c` | CloudingoAgent | 0 |  |
| 689 | `CloudingoAgent__SAV__c` | CloudingoAgent | 0 |  |
| 690 | `CloudingoAgent__SRDI__c` | CloudingoAgent | 0 |  |
| 691 | `CloudingoAgent__STZ__c` | CloudingoAgent | 0 |  |
| 692 | `Commisionable_User_Email__c` |  | 0 |  |
| 693 | `Company_Size__c` |  | 0 |  |
| 694 | `Company_ZoomInfo_ID__c` |  | 0 |  |
| 695 | `Compliance_Manager_Sites_Paid__c` |  | 0 |  |
| 696 | `Compliance_Manager_Sites_used__c` |  | 0 |  |
| 697 | `Compliance_Manager_Utilization__c` |  | 0 |  |
| 698 | `CongaAcctOwnerRole__c` |  | 0 |  |
| 699 | `Connect_2021_from_Opty_del__c` |  | 0 |  |
| 700 | `contract_end_date__c` |  | 0 |  |
| 701 | `contract_start_date__c` |  | 0 |  |
| 702 | `Count__c` |  | 0 |  |
| 703 | `Ctvt_LegalSignatoryEmail__c` |  | 0 |  |
| 704 | `Ctvt_LegalSignatoryName__c` |  | 0 |  |
| 705 | `Custom_Lead_Record_Type__c` |  | 0 |  |
| 706 | `Custom_State__c` |  | 0 |  |
| 707 | `Customer_Account_Number__c` |  | 0 |  |
| 708 | `Customer_Transition_Email__c` |  | 0 |  |
| 709 | `Cyber_Security_Specialist__c` |  | 0 |  |
| 710 | `D_B_Annual_Sales_USD__c` |  | 0 |  |
| 711 | `D_B_Employees_Total__c` |  | 0 |  |
| 712 | `D_B_Line_of_Business__c` |  | 0 |  |
| 713 | `D_B_SIC_2__c` |  | 0 |  |
| 714 | `D_B_Year_Started__c` |  | 0 |  |
| 715 | `D_U_N_S_Number__c` |  | 0 |  |
| 716 | `Days_to_Contract_Expire_LeastExpr__c` |  | 0 |  |
| 717 | `Days_to_Contract_Expire_MostExpr__c` |  | 0 |  |
| 718 | `Disable_Access__c` |  | 0 |  |
| 719 | `Display_Info__c` |  | 0 |  |
| 720 | `DOZISF__ZoomInfo_Enrich_Status__c` | DOZISF | 0 |  |
| 721 | `DOZISF__ZoomInfo_InboxAI_ID__c` | DOZISF | 0 |  |
| 722 | `DOZISF__ZoomInfo_Last_Updated__c` | DOZISF | 0 |  |
| 723 | `DWID_Domain_Seats_Paid__c` |  | 0 |  |
| 724 | `DWID_Domain_Seats_Used__c` |  | 0 |  |
| 725 | `DWID_Domain_Utilization__c` |  | 0 |  |
| 726 | `Exclude_From_Transition_Report__c` |  | 0 |  |
| 727 | `Exempt_from_Collections_Escalation__c` |  | 0 |  |
| 728 | `Gainsight_Customer__c` |  | 0 |  |
| 729 | `Has_Active_CCD__c` |  | 0 |  |
| 730 | `Health_Assessment_Customer_Last_Update__c` |  | 0 |  |
| 731 | `Health_Assessment_Rep_Last_Update__c` |  | 0 |  |
| 732 | `IPP_Datto_Transition__c` |  | 0 |  |
| 733 | `isCustomer__c` |  | 0 |  |
| 734 | `IT_Automation_Specialist__c` |  | 0 |  |
| 735 | `ITG_Hardcoded_Reseller__c` |  | 0 |  |
| 736 | `ITG_Plan_Extra_Seat_MRR_In_Number__c` |  | 0 |  |
| 737 | `ITG_Plan_MRR_In_Number__c` |  | 0 |  |
| 738 | `ITG_Total_Coupon_Discount_In_Number__c` |  | 0 |  |
| 739 | `iv__InsideView_Company_ID__c` | iv | 0 |  |
| 740 | `iv__InsideView_Created__c` | iv | 0 |  |
| 741 | `iv__InsideView_Data_Integrity_Status__c` | iv | 0 |  |
| 742 | `iv__InsideView_Date_Last_Updated__c` | iv | 0 |  |
| 743 | `iv__InsideView_Match_Status__c` | iv | 0 |  |
| 744 | `iv__InsideView_Parent_Company_ID__c` | iv | 0 |  |
| 745 | `iv__InsideView_Ultimate_Parent_Company_ID__c` | iv | 0 |  |
| 746 | `iv__InsideView_User_Last_Updated__c` | iv | 0 |  |
| 747 | `Kaseya_Start_Date__c` |  | 0 |  |
| 748 | `Krow__Active__c` | Krow | 0 |  |
| 749 | `Krow__Display_Timesheet_Notes__c` | Krow | 0 |  |
| 750 | `Krow__Exclude_From_Survey_Scheduler__c` | Krow | 0 |  |
| 751 | `Krow__Formatting__c` | Krow | 0 |  |
| 752 | `Krow__Hubspot_Customer_Id__c` | Krow | 0 |  |
| 753 | `Krow__Include_Rate__c` | Krow | 0 |  |
| 754 | `Krow__Intacct_Customer_Id__c` | Krow | 0 |  |
| 755 | `Krow__Invoice_Default_Language__c` | Krow | 0 |  |
| 756 | `Krow__Payment_Schedule__c` | Krow | 0 |  |
| 757 | `Krow__PipeDrive_Customer_Id__c` | Krow | 0 |  |
| 758 | `Krow__QB_Customer_Id__c` | Krow | 0 |  |
| 759 | `Krow__Summarize__c` | Krow | 0 |  |
| 760 | `Krow__Sync_Result__c` | Krow | 0 |  |
| 761 | `Krow__Terms__c` | Krow | 0 |  |
| 762 | `Krow__Zendesksell_Customer_Id__c` | Krow | 0 |  |
| 763 | `Last_Activity_Range__c` |  | 0 |  |
| 764 | `Last_ITC_EBC_Win_Note__c` |  | 0 |  |
| 765 | `Last_Non_Boomi_Update_Date_Derived__c` |  | 0 |  |
| 766 | `LastAdClickDate__c` |  | 0 |  |
| 767 | `LastUniqueVisitorsSnapshot__c` |  | 0 |  |
| 768 | `LastVisitMoment__c` |  | 0 |  |
| 769 | `LastVisitSessionsSnapshot__c` |  | 0 |  |
| 770 | `Latest_Opportunity_Created_Date__c` |  | 0 |  |
| 771 | `lead_source__c` |  | 0 |  |
| 772 | `Litmos__Active__c` | Litmos | 0 |  |
| 773 | `Litmos__CustomerPriority__c` | Litmos | 0 |  |
| 774 | `Litmos__Litmos_Id__c` | Litmos | 0 |  |
| 775 | `Litmos__NumberofLocations__c` | Litmos | 0 |  |
| 776 | `Litmos__SLA__c` | Litmos | 0 |  |
| 777 | `Litmos__SLAExpirationDate__c` | Litmos | 0 |  |
| 778 | `Litmos__SLASerialNumber__c` | Litmos | 0 |  |
| 779 | `Litmos__UpsellOpportunity__c` | Litmos | 0 |  |
| 780 | `Maintenance_Notes__c` |  | 0 |  |
| 781 | `Maintenance_Renewal__c` |  | 0 |  |
| 782 | `Merge_Tag__c` |  | 0 |  |
| 783 | `mkto2_Original_Source_Type__c` |  | 0 |  |
| 784 | `MR_FA__c` |  | 0 |  |
| 785 | `Mulesoft_Correlation_ID_Inbound__c` |  | 0 |  |
| 786 | `MXN_Days_Until_Not_MR_Compliant__c` |  | 0 |  |
| 787 | `MXN_Owner_Profile__c` |  | 0 |  |
| 788 | `Network_Detective_Number_of_Scans_L90__c` |  | 0 |  |
| 789 | `Network_Detective_of_Logins_L90__c` |  | 0 |  |
| 790 | `Network_Detective_Sites_Paid__c` |  | 0 |  |
| 791 | `Network_Detective_Sites_used__c` |  | 0 |  |
| 792 | `Network_Detective_Utilization__c` |  | 0 |  |
| 793 | `New_Datto_Account_Merge_ID__c` |  | 0 |  |
| 794 | `NNC_FA__c` |  | 0 |  |
| 795 | `Num_Customers__c` |  | 0 |  |
| 796 | `Num_of_Employees_Integrate__c` |  | 0 |  |
| 797 | `Num_of_Opportunities__c` |  | 0 |  |
| 798 | `Num_Supported_Locations__c` |  | 0 |  |
| 799 | `Partner_Program_Transition__c` |  | 0 |  |
| 800 | `Primary__c` |  | 0 |  |
| 801 | `recent_conversion__c` |  | 0 |  |
| 802 | `Renewal_Type__c` |  | 0 |  |
| 803 | `Reseller_Account_Country__c` |  | 0 |  |
| 804 | `Reseller_Account_Name__c` |  | 0 |  |
| 805 | `Reseller_Account_Owner__c` |  | 0 |  |
| 806 | `Reseller_Status__c` |  | 0 |  |
| 807 | `rh2__Describe__c` | rh2 | 0 |  |
| 808 | `rh2__testCurrency__c` | rh2 | 0 |  |
| 809 | `SBQQ__AssetQuantitiesCombined__c` | SBQQ | 0 |  |
| 810 | `SBQQ__ContractCoTermination__c` | SBQQ | 0 |  |
| 811 | `SBQQ__CoTermedContractsCombined__c` | SBQQ | 0 |  |
| 812 | `SBQQ__CoTerminationEvent__c` | SBQQ | 0 |  |
| 813 | `SBQQ__DefaultOpportunity__c` | SBQQ | 0 |  |
| 814 | `SBQQ__IgnoreParentContractedPrices__c` | SBQQ | 0 |  |
| 815 | `SBQQ__PriceHoldEnd__c` | SBQQ | 0 |  |
| 816 | `SBQQ__TaxExempt__c` | SBQQ | 0 |  |
| 817 | `SF_ID__c` |  | 0 |  |
| 818 | `StartOfSurge__c` |  | 0 |  |
| 819 | `Sub_Type_Business_Unit__c` |  | 0 |  |
| 820 | `Surge_Heat__c` |  | 0 |  |
| 821 | `SurgeDataUpToDateAsOf__c` |  | 0 |  |
| 822 | `SurgingAwarenessPages__c` |  | 0 |  |
| 823 | `SurgingHighValuePages__c` |  | 0 |  |
| 824 | `SurgingModels__c` |  | 0 |  |
| 825 | `target_users__c` |  | 0 |  |
| 826 | `Test11__c` |  | 0 |  |
| 827 | `Total_Datto_Kaseya_ARR__c` |  | 0 |  |
| 828 | `Traverse_Tier__c` |  | 0 |  |
| 829 | `trial_expiration_date__c` |  | 0 |  |
| 830 | `UEB_Activation_Codes__c` |  | 0 |  |
| 831 | `UEB_Paid_Support_Expired__c` |  | 0 |  |
| 832 | `UniqueEntry__Account_Dupes_Ignored__c` | UniqueEntry | 0 |  |
| 833 | `UniqueEntry__Current_Endpoint__c` | UniqueEntry | 0 |  |
| 834 | `UniqueEntry__EnrichedOn__c` | UniqueEntry | 0 |  |
| 835 | `UniqueEntry__isRingLeadEnriched__c` | UniqueEntry | 0 |  |
| 836 | `UniqueEntry__RingLead_App_Field__c` | UniqueEntry | 0 |  |
| 837 | `UniqueEntry__RingLead_Enrichment_Result__c` | UniqueEntry | 0 |  |
| 838 | `UniqueEntry__Ringlead_Id__c` | UniqueEntry | 0 |  |
| 839 | `UniqueEntry__RingLead_Last_Processed_Date__c` | UniqueEntry | 0 |  |
| 840 | `UniqueWebVisitorsRolling30__c` |  | 0 |  |
| 841 | `Unitrends_Data_Migration_Version__c` |  | 0 |  |
| 842 | `Update_Last_Task_Date_2__c` |  | 0 |  |
| 843 | `Update_Last_Task_Date__c` |  | 0 |  |
| 844 | `Vorex_Tier__c` |  | 0 |  |
| 845 | `VSA_Interest__c` |  | 0 |  |
| 846 | `WebVisitDataUpToDateAsOf__c` |  | 0 |  |
| 847 | `WebVisitsRolling30__c` |  | 0 |  |
| 848 | `X365_Command_Tier__c` |  | 0 |  |
