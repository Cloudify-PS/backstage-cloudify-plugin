import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import MaterialButton from '@material-ui/core/Button';
import { Table, TableColumn, Progress } from '@backstage/core-components';
import Alert from '@material-ui/lab/Alert';
import useAsync from 'react-use/lib/useAsync';


const CLOUDIFY_MANAGER_URL = 'http://${CLOUDIFY_MANAGER_IP}';
const BACKSTAGE_BACKEND_URL = 'http://${BACKSTAGE_BACKEND_IP}:7007';


const useStyles = makeStyles({
    avatar: {
      height: 32,
      width: 32,
      borderRadius: '50%',
    },
  });
  
  type Deployment = {
    id: string;
    display_name: string;
    blueprint_id: string;
    labels: object[];
  };
  
  type Label = {
    key: string;
    value: string;
    created_at: string;
    creator_id: number;
  };
  
  type DenseTableProps = {
    deployments: Deployment[];
  };
  
  let resolveLabels = function (rawLabels: Label[]): string {
    var labels = "";
    for (let label of rawLabels) {
      if (label !== undefined) {
        labels += label?.key + ": " + label?.value + "\n";
      }
    }
    return labels;
  };
  
  export const DenseTable = ({ deployments }: DenseTableProps) => {
    const classes = useStyles();
    const columns: TableColumn[] = [
      { title: 'Icon', field: 'icon', width: '50' },
      { title: 'ID', field: 'id' },
      { title: 'Display Name', field: 'display_name' },
      { title: 'Blueprint ID', field: 'blueprint_id' },
      { title: 'Labels', field: 'labels' },
      { title: 'Actions', field: 'actions' }
    ];
  
    const data = deployments.map(deployment => {
      var img_src = CLOUDIFY_MANAGER_URL + '/console/ba/image/' + deployment.blueprint_id;
      var deployment_url = CLOUDIFY_MANAGER_URL
                        + '/console/page/services_deployment/' + deployment.id
                        + '?c=[{"context"%3A{"deploymentId"%3A"' + deployment.id
                        + '"%2C"mapOpen"%3Afalse}}%2C{"context"%3A{"deploymentId"%3A"' + deployment.id
                        + '"}%2C"pageName"%3A"' + deployment.id 
                        + '"}]';
      return {
        icon: (
          <a href={deployment_url} target="_blank">
          <img
            src={img_src}
            className={classes.avatar}
            alt={deployment.id}
          />
          </a>
        ),
        id: (
          <a href={deployment_url} target="_blank">{deployment.id}</a>
        ),
        display_name: deployment.display_name || deployment.id,
        blueprint_id: deployment.blueprint_id,
        labels: resolveLabels(deployment.labels),
        actions: 
          <MaterialButton 
            onClick={async () => {
              const options = {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Tenant': 'default_tenant'
                },
                body: JSON.stringify({
                  'deployment_id': deployment.id,
                  'workflow_id': 'uninstall'
                })
              };
              const response = await fetch(
                BACKSTAGE_BACKEND_URL + '/api/proxy/cloudify/api/executions',
                options);
              const data = await response.json();
            
              if (response.ok) {
                alert('Deployment uninstalled successfully');
              } else if (!response.ok) {
                alert('Error')
              }
            }} 
            color="primary" 
            variant="contained">
              Uninstall
          </MaterialButton>
      };
    });
  
    return (
      <Table
        title="Cloudify Manager Deployments"
        options={{ search: true, paging: true, pageSize: 5 }}
        columns={columns}
        data={data}
      />
    );
  };
  
  export const DeploymentsComponent = () => {
    const { value, loading, error } = useAsync(async (): Promise<Deployment[]> => {
  
      const response = await fetch(
        BACKSTAGE_BACKEND_URL + '/api/proxy/cloudify/api/deployments'
        + '?_include=id,display_name,blueprint_id,labels'
      );
  
      const data = await response.json();
      return data.items;
    }, []);
  
    if (loading) {
      return <Progress />;
    } else if (error) {
      return <Alert severity="error">{error.message}</Alert>;
    }
  
    return <DenseTable deployments={value || []} />;
  };
  