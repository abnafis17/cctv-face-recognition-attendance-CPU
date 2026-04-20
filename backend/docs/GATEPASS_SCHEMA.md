# GatepassTable Schema (Company Scoped)

```mermaid
erDiagram
    Company ||--o{ GatepassTable : owns
    Employee ||--o{ GatepassTable : requests
    Camera ||--o{ GatepassTable : request_camera
    Camera ||--o{ GatepassTable : return_camera

    Company {
      string id PK
      string companyName
    }

    Employee {
      string id PK
      string empId
      string companyId FK
      string name
      string department
      string unit
      string line
      string section
    }

    Camera {
      string id PK
      string camId
      string companyId FK
      string name
      string task
    }

    GatepassTable {
      string id PK
      string companyId FK
      string employeeId FK
      string leaveTypeId
      string leaveType
      string purpose
      string destination
      datetime outTime
      datetime inTime
      string status
      string requestCameraId FK
      string returnCameraId FK
      datetime externalSubmitAckAt
      json externalSubmitPayload
      datetime externalReturnAckAt
      json externalReturnPayload
      datetime createdAt
      datetime updatedAt
    }
```

## Field Rules
- `companyId` is required and enforces strict company-level separation.
- `employeeId` is required and must belong to the same company.
- `leaveTypeId` stores the ERP pass-type id selected from the gatepass dropdown.
- `leaveType` stores the ERP pass-type label (`passtitle`) selected from the gatepass dropdown.
- `purpose` is required.
- `destination` is optional.
- `outTime` is always stored on submit.
- `inTime` is null until the person is recognized on return.
- `status` is `out` initially and moves to `returned` when `inTime` is set.

## Workflow
1. Create request:
- Load pass types from the ERP endpoint configured in `CompanyErpSetting` for `urlType=gatepass`.
- Save both the selected ERP pass-type id (`leaveTypeId`) and label (`leaveType`).

2. Return recognition:
- For recognized employee, find the latest open gatepass row (`status=out`, `inTime=null`).
- Set `inTime`, set `status=returned`, and run demo final API call.
