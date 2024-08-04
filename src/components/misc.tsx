import React from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

export const AboutMessageTooltipTrigger: React.FC = () => (
  <OverlayTrigger
    rootClose // hides tooltip when user clicks outside of it
    trigger={"click"}
    placement={"bottom"}
    overlay={
      <Tooltip id={"about"}>
        <AboutMessage />
      </Tooltip>
    }
  >
    <i
      className="bi bi-question-circle"
      style={{ fontSize: 16, verticalAlign: "top" }}
    ></i>
  </OverlayTrigger>
);

const AboutMessage: React.FC = () => (
  <>
    Changesheet converter is a tool you can use to convert a{" "}
    <a
      target={"_blank"}
      rel={"noreferrer"}
      className={"text-decoration-none"}
      href={
        "https://microbiomedata.github.io/nmdc-runtime/howto-guides/author-changesheets/"
      }
    >
      changesheet
    </a>{" "}
    into a set of HTTP request payloads for the <code>/queries:run</code>{" "}
    endpoint of the{" "}
    <a
      target={"_blank"}
      rel={"noreferrer"}
      className={"text-decoration-none"}
      href={"https://api.microbiomedata.org/"}
    >
      NMDC Runtime API
    </a>
    .
  </>
);
