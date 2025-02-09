import { Form, Input } from "antd";
import ManageTemplate from "../../components/ManageTemplate/ManageTemplate";

function ManageBlog() {
  const title = "blog";
  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Category", dataIndex: "category", key: "category" },
  ];

  const formItems = (
    <>
      <Form.Item
        name='blog'
        label='Blog'
        rules={[{ required: true, message: "Please input category name" }]}>
        <Input />
      </Form.Item>
      <Form.Item name='description' label='Description'>
        <Input.TextArea />
      </Form.Item>
    </>
  );

  return (
    <div>
      <ManageTemplate title={title} columns={columns} formItems={formItems} />
    </div>
  );
}

export default ManageBlog;
