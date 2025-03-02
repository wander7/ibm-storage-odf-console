/**
 * Copyright contributors to the ibm-storage-odf-console project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from "react";
import * as _ from "lodash";
import { useTranslation } from "react-i18next";
import {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardBody,
  ResourceInventoryItem,
} from "@openshift-console/dynamic-plugin-sdk-internal";
import {
  FirehoseResource,
  K8sResourceCommon,
} from "@openshift-console/dynamic-plugin-sdk";
import { useK8sWatchResource } from "@openshift-console/dynamic-plugin-sdk";
import {
  PersistentVolumeModel,
  PersistentVolumeClaimModel,
  StorageClassModel,
  PodModel,
} from "../../models";
import {
  getCustomizedPVCs,
  getCustomizedSC,
  getCustomizedPVs,
  getCustomizedPods,
} from "../../selectors/index";
import { IBM_STORAGE_CSI_PROVISIONER } from "../../constants/index";
import {
  getPVCStatusGroups,
  getPodStatusGroups,
  getPVStatusGroups,
} from "./utils";

const pvcResource: FirehoseResource = {
  isList: true,
  kind: PersistentVolumeClaimModel.kind,
  prop: "pvcs",
};
const scResource: FirehoseResource = {
  isList: true,
  kind: StorageClassModel.kind,
  prop: "sc",
};
const pvResource: FirehoseResource = {
  isList: true,
  kind: PersistentVolumeModel.kind,
  prop: "pvs",
};
const podResource: FirehoseResource = {
  isList: true,
  kind: PodModel.kind,
  prop: "pods",
};

export const InventoryCard: React.FC<any> = () => {
  const { t } = useTranslation("plugin__ibm-storage-odf-plugin");
  const currentProvisioner = IBM_STORAGE_CSI_PROVISIONER;
  const [pvcsData, pvcsLoaded, pvcsLoadError] =
    useK8sWatchResource<K8sResourceCommon[]>(pvcResource);
  const [pvsData, pvsLoaded, pvsLoadError] =
    useK8sWatchResource<K8sResourceCommon[]>(pvResource);
  const [podsData, podsLoaded, podsLoadError] =
    useK8sWatchResource<K8sResourceCommon[]>(podResource);
  const [scData, scLoaded, scLoadError] =
    useK8sWatchResource<K8sResourceCommon[]>(scResource);

  const filteredSC = getCustomizedSC(scData, currentProvisioner);
  const filteredSCNames = filteredSC.map((sc) => _.get(sc, "metadata.name"));

  const scHref = `/k8s/cluster/storageclasses?rowFilter-sc-provisioner=${currentProvisioner}`;
  const pvcHref = `/k8s/all-namespaces/persistentvolumeclaims?rowFilter-pvc-provisioner=${currentProvisioner}`;
  const pvHref = `/k8s/cluster/persistentvolumes?rowFilter-pv-provisioner=${currentProvisioner}`;
  const podHref = `/k8s/cluster/pods?rowFilter-pod-provisioner=${currentProvisioner}`;

  const filteredPVCs =
    !_.isEmpty(pvcsData) && !_.isEmpty(pvsData)
      ? getCustomizedPVCs(
          filteredSCNames,
          pvcsData,
          pvsData,
          currentProvisioner
        )
      : [];

  const filteredPVs = getCustomizedPVs(pvsData, currentProvisioner);
  const filterdPod = getCustomizedPods(
    podsData,
    currentProvisioner,
    filteredPVCs
  );

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>{t("Inventory")}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <ResourceInventoryItem
          isLoading={!scLoaded}
          error={!!scLoadError}
          kind={StorageClassModel}
          resources={filteredSC}
          showLink={true}
          basePath={scHref}
        />
        <ResourceInventoryItem
          dataTest="inventory-pvc"
          isLoading={!pvcsLoaded || !pvsLoaded}
          error={!!pvcsLoadError || !!pvsLoadError}
          kind={PersistentVolumeClaimModel}
          resources={filteredPVCs}
          mapper={getPVCStatusGroups}
          showLink={true}
          basePath={pvcHref}
        />

        <ResourceInventoryItem
          isLoading={!pvsLoaded}
          error={!!pvsLoadError}
          kind={PersistentVolumeModel}
          resources={filteredPVs}
          mapper={getPVStatusGroups}
          showLink={true}
          basePath={pvHref}
        />
        <ResourceInventoryItem
          isLoading={!podsLoaded}
          error={!!podsLoadError}
          kind={PodModel}
          resources={filterdPod}
          mapper={getPodStatusGroups}
          showLink={true}
          basePath={podHref}
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default InventoryCard;
