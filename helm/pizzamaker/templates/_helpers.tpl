{{/*
Release-scoped name, so two installs of this chart in one namespace don't collide.
*/}}
{{- define "pizzamaker.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Selector labels — the immutable subset. A Deployment's selector cannot be changed
after creation, so these must never include anything version-dependent (chart
version, app version), or a `helm upgrade` fails with a field-is-immutable error.
*/}}
{{- define "pizzamaker.selectorLabels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Full labels — selector labels plus the metadata that is allowed to drift.
*/}}
{{- define "pizzamaker.labels" -}}
{{ include "pizzamaker.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version }}
{{- end -}}